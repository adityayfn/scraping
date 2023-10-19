import { siteConfig } from "~/utils/siteConfig"
import axios from "axios"
import * as cheerio from "cheerio"
let baseUrl = siteConfig.scrapUrl
export default defineEventHandler(async () => {
  const res = await axios.get(baseUrl)

  try {
    const $ = cheerio.load(res.data)

    const categories = []

    $("select[name='genre'] option").each((i, el) => {
      categories.push({
        name: $(el).text(),
        slug: $(el).attr("value") || "",
      })
    })

    categories.shift()

    return categories
  } catch (error) {
    return error
  }
})
