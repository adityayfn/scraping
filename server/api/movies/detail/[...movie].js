import axios from "axios"
import * as cheerio from "cheerio"

import { removeSeparator } from "~/utils/Helper"
const baseUrl = "https://nge-film21.cyou"
export default defineEventHandler(async (event) => {
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
          download_links,
        })
      }
    })
  } catch (error) {
    console.log(error)
  }

  const data = params[0] !== "tv" ? movieDetail : tvDetail

  return { data }
})

export async function getStreamingLinks(streamLinks) {
  const streamingLinks = []

  const res = await axios.get(`${baseUrl}/mortal-kombat-2021`)
  const $ = cheerio.load(res.data)

  const streamLink = $("#p1 > div")

  // for (let i = 0; i < streamLinks.length; i++) {
  //   const res = await axios.get(streamLinks[i])
  //   const $ = cheerio.load(res.data)
  //   const streamLink = $(`#p1`).contents()

  //   // streamingLinks.push(streamLink)
  // }
  console.log(streamLink.length)

  // return streamingLinks
}
