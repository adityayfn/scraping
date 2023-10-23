module.exports = {
  launchOptions: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    useragent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36",
  },
  executablePath: "/usr/bin/google-chrome",
  userDataDir: "~/.cache/puppeteer",
}
