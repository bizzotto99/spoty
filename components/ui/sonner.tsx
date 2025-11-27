'use client'

import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        style: {
          background: "#1a1a1a",
          border: "1px solid #333",
          color: "#fff",
        },
        classNames: {
          error: "border-[#1DB954]",
          success: "border-[#1DB954]",
          actionButton: "bg-[#1DB954] hover:bg-[#1ed760] text-black font-medium rounded-md",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
