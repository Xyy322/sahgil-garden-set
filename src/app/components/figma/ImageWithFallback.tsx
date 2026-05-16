// ImageWithFallback displays an image and shows a fallback SVG if loading fails.
// It affects the system by improving user experience and preventing broken image icons in the UI.
// This file uses React state to track load errors and conditionally render fallback content.
import React, { useState } from 'react'

// Base64-encoded SVG for fallback image (gray box with X and circle)
const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

// Main image component with fallback logic.
export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  // State to track if the image failed to load.
  const [didError, setDidError] = useState(false)

  // Handler for image load error event.
  const handleError = () => {
    setDidError(true)
  }

  // Destructure props for flexibility and pass-through.
  const { src, alt, style, className, ...rest } = props

  // If image failed to load, render fallback SVG in a styled container.
  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    // Otherwise, render the image and attach error handler.
    <img src={src} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  )
}
