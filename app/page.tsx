"use client"

import { useState } from "react"
import ShaderBackground from "@/components/shader-background"
import { CameraScanner } from "@/components/camera-scanner"
import { ScannerModal } from "@/components/scanner-modal"
import { ScanHistory } from "@/components/scan-history"
import { supabase } from "@/lib/supabase/client"
import Image from "next/image"
import { ManualEntry } from "@/components/manual-entry"
import { PhoneMenuBar } from "@/components/phone-menu-bar"

export default function Home() {
  const [currentView, setCurrentView] = useState<"scanner" | "manual" | "history">("scanner")
  const [modalOpen, setModalOpen] = useState(false)
  const [scannedImei, setScannedImei] = useState("")

  const handleScanResult = (imei: string) => {
    setScannedImei(imei)
    setModalOpen(true)
  }

  const handleSaveScan = async (data: { imei: string; model: string; storage: string }) => {
    const { error } = await supabase.from("scans").insert([data])

    if (error) {
      throw new Error(error.message)
    }
  }

  return (
    <ShaderBackground>
      <div className="relative z-10 min-h-screen">
        <div className="bg-gradient-to-b from-black/40 to-transparent backdrop-blur-sm border-b border-white/10">
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-md">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="p-2 sm:p-3 bg-primary/20 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-primary/30">
                  <Image
                    src="/images/qr-code-logo.jpg"
                    alt="PhoneBox QR Code Logo"
                    width={28}
                    height={28}
                    className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                  />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black font-montserrat text-white tracking-tight">PhoneBox</h1>
              </div>
              <p className="text-sm sm:text-base text-white/80 font-medium">Professional Inventory Scanner</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-md">
          <div className="mb-6 sm:mb-8 flex justify-center">
            <PhoneMenuBar currentView={currentView} onViewChange={setCurrentView} />
          </div>

          <div className="space-y-6 sm:space-y-8">
            {currentView === "scanner" ? (
              <CameraScanner onScanResult={handleScanResult} />
            ) : currentView === "manual" ? (
              <ManualEntry onSave={handleSaveScan} />
            ) : (
              <ScanHistory />
            )}
          </div>

          <ScannerModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            imei={scannedImei}
            onSave={handleSaveScan}
          />
        </div>
      </div>
    </ShaderBackground>
  )
}
