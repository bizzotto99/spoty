'use client'

import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        style: {
          background: "#0f0f0f",
          border: "2px solid #1DB954",
          borderRadius: "16px",
          color: "#fff",
          padding: "16px",
        },
        classNames: {
          error: "border-[#1DB954]",
          success: "border-[#1DB954]",
          actionButton: "bg-[#1DB954] hover:bg-[#1ed760] text-black font-medium rounded-full px-5 py-2 transition-all",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
