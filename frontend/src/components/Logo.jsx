import React from 'react'

export function DatabaseIcon({ className = "w-6 h-6", strokeWidth = "2" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  )
}

export default function Logo({ size = 'md', hideText = false, brandLabel = 'SchemaFlow' }) {
  const iconSize = size === 'lg' ? 'w-10 h-10' : size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'
  const textSize = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-lg' : 'text-xl'

  return (
    <div className="flex items-center gap-2.5 logo-colors">
      <div className="flex shrink-0 items-center justify-center transition-colors">
        <DatabaseIcon className={iconSize} strokeWidth="2.5" />
      </div>
      {!hideText && (
        <span className={`${textSize} font-bold tracking-tight whitespace-nowrap transition-colors`}>
          {brandLabel}
        </span>
      )}
    </div>
  )
}
