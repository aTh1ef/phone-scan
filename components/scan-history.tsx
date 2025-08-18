"use client"

import { useState, useEffect } from "react"
import { Trash2, Calendar, Smartphone, HardDrive } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface Scan {
  id: number
  imei: string
  model: string
  storage: string
  created_at: string
}

export function ScanHistory() {
  const [scans, setScans] = useState<Scan[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadHistory = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("scans").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setScans(data || [])
    } catch (error) {
      console.error("Error loading history:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteScan = async (id: number) => {
    try {
      const { error } = await supabase.from("scans").delete().eq("id", id)

      if (error) throw error
      setScans(scans.filter((scan) => scan.id !== id))
    } catch (error) {
      console.error("Error deleting scan:", error)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Scan History</h2>
        <button
          onClick={loadHistory}
          disabled={isLoading}
          className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-200 disabled:opacity-50"
        >
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {scans.length === 0 ? (
        <div className="text-center py-8 text-white/60">No scans yet. Start scanning to see your history!</div>
      ) : (
        <div className="space-y-3">
          {scans.map((scan) => (
            <div
              key={scan.id}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 animate-in slide-in-from-bottom-2 duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 text-white">
                    <Smartphone className="w-4 h-4" />
                    <span className="font-medium">{scan.model}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <HardDrive className="w-4 h-4" />
                    <span>{scan.storage}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(scan.created_at)}</span>
                  </div>
                  <div className="text-xs text-white/40 font-mono">IMEI: {scan.imei}</div>
                </div>
                <button
                  onClick={() => deleteScan(scan.id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
