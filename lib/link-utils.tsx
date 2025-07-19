import React from 'react'

/**
 * Renders text content with clickable green links
 * @param content - The text content to process
 * @returns JSX element with clickable links
 */
export function renderContentWithLinks(content: string): React.ReactNode {
  if (!content) return null

  const URL_REGEX = /(https?:\/\/[^\s]+)/g
  const parts = content.split(URL_REGEX)
  
  return (
    <>
      {parts.map((part, index) => {
        // Check if this part is a URL
        const urlTest = /(https?:\/\/[^\s]+)/
        if (urlTest.test(part)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          )
        }
        return part
      })}
    </>
  )
}

/**
 * Extracts URLs from text content
 * @param content - The text content to search
 * @returns Array of URLs found in the content
 */
export function extractUrls(content: string): string[] {
  if (!content) return []
  
  const URL_REGEX = /(https?:\/\/[^\s]+)/g
  const matches = content.match(URL_REGEX)
  return matches || []
}