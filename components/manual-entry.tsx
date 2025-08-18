"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit3, Plus } from "lucide-react"

interface ManualEntryProps {
  onSave: (data: { imei: string; model: string; storage: string }) => Promise<void>
}

export function ManualEntry({ onSave }: ManualEntryProps) {
  const [imei, setImei] = useState("")
  const [model, setModel] = useState("")
  const [storage, setStorage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!imei.trim() || !model.trim() || !storage.trim()) {
      return
    }

    setIsLoading(true)
    try {
      await onSave({
        imei: imei.trim(),
        model: model.trim(),
        storage: storage.trim(),
      })

      // Reset form
      setImei("")
      setModel("")
      setStorage("")
    } catch (error) {
      console.error("Failed to save manual entry:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-3">
          <Edit3 className="w-5 h-5 text-white" />
          <span className="text-white font-semibold font-montserrat">Manual Entry</span>
        </div>
        <p className="text-white/70 text-sm">Enter phone details manually</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="imei" className="text-white font-semibold">
              IMEI Number
            </Label>
            <Input
              id="imei"
              type="text"
              placeholder="Enter 15-digit IMEI"
              value={imei}
              onChange={(e) => setImei(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-primary focus:ring-primary/20"
              maxLength={15}
              pattern="[0-9]{15}"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model" className="text-white font-semibold">
              Phone Model
            </Label>
            <Input
              id="model"
              type="text"
              placeholder="Enter phone model (e.g., iPhone 15 Pro Max)"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-primary focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="storage" className="text-white font-semibold">
              Storage Capacity
            </Label>
            <Input
              id="storage"
              type="text"
              placeholder="Enter storage (e.g., 256GB)"
              value={storage}
              onChange={(e) => setStorage(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-primary focus:ring-primary/20"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!imei.trim() || !model.trim() || !storage.trim() || isLoading}
          className="w-full bg-white text-black font-bold py-4 px-6 rounded-xl border-4 border-gray-800 shadow-[0_6px_0_0_#1f2937] active:shadow-[0_2px_0_0_#1f2937] active:translate-y-1 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-[0_6px_0_0_#1f2937] flex items-center justify-center gap-3"
        >
          <Plus className="w-5 h-5" />
          {isLoading ? "Adding..." : "Add Entry"}
        </button>
      </form>
    </div>
  )
}
