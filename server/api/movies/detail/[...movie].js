import axios from "axios"
import * as cheerio from "cheerio"
import puppeteer from "puppeteer"
import { siteConfig } from "~/utils/siteConfig"
import { removeSeparator } from "~/utils/Helper"

let baseUrl = siteConfig.scrapUrl
export default defineEventHandler(async (event) => {
  event.res.setHeader("Access-Control-Allow-Origin", "*")

  let url = baseUrl
  const params = event.context.params.movie.split("/")

  if (params.length < 2) {
    url = `${baseUrl}/${params[0]}`
  } else {
    url = `${baseUrl}/${params[0]}/${params[1]}`
  }

  const download_links = []
  const movieDetail = []
  const tvDetail = []
  const dataMovie = {}
  try {
    const res = await axios.get(url)
    const $ = cheerio.load(res.data)

    const download = $("#download")
    download.each((i, el) => {
      $(el)
        .find("a.button.button-shadow")
        .each((i, el) => {
          download_links.push({
            link: $(el).attr("href"),
            text: $(el).text(),
          })
        })
    })

    const streamLinks = []
    const numOfStreamLinks = $("ul.muvipro-player-tabs li a")
      .text()
      .split(" ")
      .at(-1)
    // console.log(numOfStreamLinks)
    if (numOfStreamLinks) {
      for (let i = 1; i <= parseInt(numOfStreamLinks); i++) {
        streamLinks.push(`${url}/#p${i}`)
      }
    }

    const streamingLinks = await getStreamingLinks(streamLinks)

    const eps_links_tv = []
    $(".gmr-listseries a").each((i, el) => {
      if (i !== 0) {
        let link = $(el).attr("href")
        eps_links_tv.push({
          title: $(el).text(),
          tvId: link?.replace(siteConfig.scrapUrl, ""),
        })
      }
    })

    $("#main").each((index, element) => {
      $(element)
        .find(".gmr-moviedata")
        .each((i, ec) => {
          // ec = element child
          const textLine = removeSeparator($(ec).text())[0]
            .toLowerCase()
            .replace(" ", "_")
          const textValue = removeSeparator($(ec).text())[1].toLowerCase()

          dataMovie[textLine] = textValue
        })

      if (params[0] !== "tv") {
        movieDetail.push({
          title: $(element).find("h1.entry-title").text(),
          description: $(element).find("div.entry-content p").text(),
          created_at: dataMovie.diposting_pada ?? "",
          tagline: dataMovie.tagline ?? "",
          rating: dataMovie.rating ?? "",
          genre: dataMovie.genre ?? "",
          quality: dataMovie.kualitas ?? "",
          duration: dataMovie.durasi ?? "",
          release_date: dataMovie.rilis ?? "",
          language: dataMovie.bahasa ?? "",
          director: dataMovie.direksi ?? "",
          artist: dataMovie.pemain ?? "",
          download_links,
          streamingLinks,
        })
      } else {
        tvDetail.push({
          title: $(element).find("h1.entry-title").text(),
          trailer: $(element).find(".gmr-embed-responsive iframe").attr("src"),
          description: $(element).find("div.entry-content p").text(),
          created_at: dataMovie.diposting_pada ?? "",
          genre: dataMovie.genre ?? "",
          year: dataMovie.tahun ?? "",
          duration: dataMovie.durasi ?? "",
          country: dataMovie.negara ?? "",
          realease: dataMovie.rilis ?? "",
          number_of_eps: dataMovie.jumlah_episode ?? "",
          network: dataMovie.jaringan ?? "",
          artist: dataMovie.pemain ?? "",
          eps_links: eps_links_tv,
        })
      }
    })
    const data = params[0] !== "tv" ? movieDetail : tvDetail
    return data
  } catch (error) {
    return error
  }
})

export async function getStreamingLinks(streamLinks) {
  const streamingLinks = []

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/usr/bin/chromium-browser",
    cacheDirectory: "~/.cache/puppeteer",
  })

  try {
    for (let i = 0; i < streamLinks.length; i++) {
      const url = streamLinks[i]
      const page = await browser.newPage()
      await page.goto(url, {
        waitUntil: "domcontentloaded",
      })

      const linksWithId = await page.$$eval("li > a[id]", (elements) => {
        return elements.map((element) => element.id)
      })

      const newLinkId = linksWithId.splice(1, 4)

      for (const linkId of newLinkId) {
        await page.click(`a[id="${linkId}"]`)
        await page.waitForSelector(".selected .gmr-embed-responsive > iframe")
        await page.waitForTimeout(3000)

        const src = await page.$eval(
          ".selected .gmr-embed-responsive > iframe",
          (el) => el.getAttribute("src")
        )
        streamingLinks.push(src)
      }

      await page.close()
    }
  } catch (error) {
    console.log(error)
  }
  const filteredLinks = streamingLinks.reduce((accumulator, currentLink) => {
    if (!accumulator.includes(currentLink)) {
      accumulator.push(currentLink)
    }

    return accumulator
  }, [])
  return filteredLinks
}
