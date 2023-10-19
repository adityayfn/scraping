import axios from "axios"
import * as cheerio from "cheerio"
import { siteConfig } from "~/utils/siteConfig"

let baseUrl = siteConfig.scrapUrl
// "https://ngefilm21.host/"

export default defineEventHandler(async (event) => {
  const params = new URL(event.req.url, baseUrl)
  const page = Number(params.searchParams.get("page")) || 1
  const category = params.searchParams.get("category")
  const query = params.searchParams.get("q") ?? ""

  let url = baseUrl

  if (page > 1 || query) {
    url = `${baseUrl}/page/${page}/?s=${query}&search=advanced`
    console.log({ url, query, category, params })
  }
  if (category) {
    url = `${baseUrl}/Genre/${category}/page/${page}`
    console.log({ url, query, category, params })
  }

  const movies = []

  try {
    const res = await axios.get(url)
    const $ = cheerio.load(res.data)
    const movieEl = $("article.item-infinite")

    let lastPage = 0
    const pagination = $(".pagination")
    pagination.each((i, e) => {
      $(e).find("a.next.page-numbers").remove()

      lastPage = Number($(e).find("a.page-numbers").last().text())
    })

    movieEl.each((i, e) => {
      movies.push({
        title: $(e).find("h2.entry-title a").text(),
        movieId: $(e)
          .find("h2.entry-title a")
          .attr("href")
          ?.replace(baseUrl, ""),
        thumbnail_url: $(e).find("img.attachment-medium").attr("src"),
        duration: $(e).find(".gmr-duration-item").text().trim(),
        rating: $(e).find(".gmr-rating-item").text().trim(),
        quality: $(e).find(".gmr-quality-item a").text() || "TV Show",
        eps_now: $(e).find(".gmr-numbeps").text().replace(":", " "),
        trailer: $(e)
          .find(".gmr-popup-button > a.gmr-trailer-popup")
          .attr("href"),
        genre: $(e).find(".gmr-movie-on ").text().split(", "),
      })
    })
  } catch (error) {
    return error
  }

  return { movies, page, query, category }
})
