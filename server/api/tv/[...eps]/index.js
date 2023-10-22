import { siteConfig } from "~/utils/siteConfig"
import axios from "axios"
import * as cheerio from "cheerio"
import { getStreamingLinks } from "../../movies/detail/[...movie]"

export default defineEventHandler(async (event) => {
    event.res.setHeader("Access-Control-Allow-Origin", "*")

  const param = event.context.params.eps.split("/")

  const tvId = `${param[0]}/${param[1]}`

  let url = `${siteConfig.scrapUrl}/${tvId}`

  const res = await axios.get(url)

  try {
    const $ = cheerio.load(res.data)

    const download = $("#download")
    const downloadLinks = []
    download.each((i, el) => {
      $(el)
        .find("a.button.button-shadow")
        .each((i, el) => {
          downloadLinks.push({
            link: $(el).attr("href"),
            text: $(el).text(),
          })
        })
    })

    const streamLinks = []
    const numOfStreamingLinks = $("ul.muvipro-player-tabs li:last-child a")
      .text()
      .split(" ")
      .at(-1)
    if (numOfStreamingLinks) {
      for (let i = 1; i <= parseInt(numOfStreamingLinks); i++) {
        streamLinks.push(`${url}/#p${i}`)
      }
    }
    const streamingLinks = await getStreamingLinks(streamLinks)
    console.log(url)

    const epsLinks = []

    $(".gmr-listseries a").each((i, el) => {
      if (i !== 0) {
        let link = $(el).attr("href")
        epsLinks.push({
          title: $(el).text(),
          tvId: link?.replace(siteConfig.scrapUrl, ""),
        })
      }
    })

    const data = {
      title: $("h1.entry-title").text(),
      streamingLinks,
      epsLinks,
      downloadLinks,
    }

    return data
  } catch (error) {
    return error
  }
})
