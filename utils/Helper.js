export const removeSeparator = (str) => {
  const separator = str.split(":").map((item) => item.trim())
  return separator
}
