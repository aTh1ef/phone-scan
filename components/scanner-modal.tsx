"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"

interface ScannerModalProps {
  isOpen: boolean
  onClose: () => void
  imei: string
  onSave: (data: { imei: string; model: string; storage: string }) => Promise<void>
}

export function ScannerModal({ isOpen, onClose, imei, onSave }: ScannerModalProps) {
  const [model, setModel] = useState("")
  const [storage, setStorage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!model.trim() || !storage.trim()) return

    setIsLoading(true)
    setMessage("")

    try {
      await onSave({ imei, model: model.trim(), storage: storage.trim() })
      setMessage("Scan saved successfully!")
      setTimeout(() => {
        onClose()
        setModel("")
        setStorage("")
        setMessage("")
      }, 1500)
    } catch (error) {
      setMessage("Error saving scan")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Enter Phone Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">IMEI</label>
            <input
              type="text"
              value={imei}
              readOnly
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Model</label>
            <input
              type="text"
              placeholder="Enter phone model (e.g., iPhone 15 Pro Max)"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Storage</label>
            <input
              type="text"
              placeholder="Enter storage (e.g., 256GB)"
              value={storage}
              onChange={(e) => setStorage(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            />
          </div>

          {message && (
            <div className={`text-center py-2 ${message.includes("Error") ? "text-red-400" : "text-green-400"}`}>
              {message}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!model.trim() || !storage.trim() || isLoading}
              className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 rounded-xl text-white font-medium transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
