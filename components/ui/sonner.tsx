'use client'

import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        style: {
          background: "rgba(15, 15, 15, 0.95)",
          border: "1px solid rgba(29, 185, 84, 0.3)",
          borderRadius: "20px",
          color: "#fff",
          backdropFilter: "blur(10px)",
        },
        classNames: {
          error: "border-[#1DB954]",
          success: "border-[#1DB954]",
          actionButton: "bg-[#1DB954] hover:bg-[#1ed760] text-black font-medium rounded-full px-4 py-1.5 transition-all text-sm",
          title: "font-normal",
          description: "text-sm text-gray-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
