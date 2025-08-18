"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, Flashlight, FlashlightOff } from "lucide-react"
import { BrowserMultiFormatReader } from "@zxing/browser"

interface CameraScannerProps {
  onScanResult: (imei: string) => void
}

export function CameraScanner({ onScanResult }: CameraScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [error, setError] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)

  const startCamera = async () => {
    try {
      setError("")
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)

        // Start barcode scanning
        readerRef.current = new BrowserMultiFormatReader()
        try {
          const result = await readerRef.current.decodeOnceFromVideoElement(videoRef.current)
          onScanResult(result.text)
          stopCamera()
        } catch (err) {
          console.log("Scanning stopped or no barcode detected")
        }
      }
    } catch (err) {
      setError("Camera access denied or not available")
      console.error("Camera error:", err)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (readerRef.current) {
      readerRef.current.reset()
      readerRef.current = null
    }
    setIsScanning(false)
    setTorchOn(false)
  }

  const toggleTorch = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0]
      const capabilities = track.getCapabilities()

      if ("torch" in capabilities) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !torchOn } as any],
          })
          setTorchOn(!torchOn)
        } catch (err) {
          console.error("Torch toggle failed:", err)
        }
      }
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-video bg-black/20 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden">
        {isScanning ? (
          <>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-2 border-blue-400/50 rounded-2xl">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-32 border-2 border-blue-400 rounded-lg">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Camera className="w-16 h-16 text-white/40" />
          </div>
        )}
      </div>

      {error && <div className="text-red-400 text-center text-sm">{error}</div>}

      <div className="flex gap-3">
        <button
          onClick={isScanning ? stopCamera : startCamera}
          className="flex-1 px-6 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-xl font-semibold transition-all duration-150 flex items-center justify-center gap-2 shadow-[0_4px_0_0_#d1d5db] hover:shadow-[0_2px_0_0_#d1d5db] hover:translate-y-[2px] active:shadow-[0_0px_0_0_#d1d5db] active:translate-y-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Camera className="w-5 h-5" />
          {isScanning ? "Stop Scan" : "Start Scan"}
        </button>

        {isScanning && (
          <button
            onClick={toggleTorch}
            className="px-4 py-3 bg-yellow-400 text-gray-900 border-2 border-yellow-500 rounded-xl font-semibold transition-all duration-150 shadow-[0_4px_0_0_#eab308] hover:shadow-[0_2px_0_0_#eab308] hover:translate-y-[2px] active:shadow-[0_0px_0_0_#eab308] active:translate-y-[4px] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
          >
            {torchOn ? <FlashlightOff className="w-5 h-5" /> : <Flashlight className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  )
}
