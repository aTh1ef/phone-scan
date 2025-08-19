"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, Flashlight, FlashlightOff, AlertCircle, RotateCcw } from "lucide-react"
import { BrowserMultiFormatReader } from "@zxing/browser"

interface CameraScannerProps {
  onScanResult: (imei: string) => void
}

export function CameraScanner({ onScanResult }: CameraScannerProps) {
  const [isActive, setIsActive] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [error, setError] = useState("")
  const [streamInfo, setStreamInfo] = useState("")
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const scanningRef = useRef<boolean>(false)

  const startCamera = async () => {
    try {
      console.log("🎥 Starting camera...")
      setError("")
      setStreamInfo("")

      // Request camera with specified facing mode
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: facingMode }
          }
        })
      } catch (exactError) {
        console.log("⚠️ Exact facingMode failed, trying ideal...")
        // Fallback to ideal if exact fails
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode }
          }
        })
      }

      console.log("✅ Got camera stream:", stream)
      console.log("📹 Stream tracks:", stream.getTracks())

      setStreamInfo(`Stream active: ${stream.active}, Tracks: ${stream.getTracks().length}`)

      if (videoRef.current) {
        console.log("📺 Setting video source...")
        videoRef.current.srcObject = stream
        streamRef.current = stream

        // Force play
        try {
          await videoRef.current.play()
          console.log("▶️ Video playing successfully")
          setIsActive(true)

          // Start barcode scanning
          startBarcodeScanning()

        } catch (playError) {
          console.error("❌ Play error:", playError)
          setError(`Play failed: ${playError}`)
        }
      }
    } catch (err: any) {
      console.error("❌ Camera error:", err)
      setError(`Camera error: ${err.name} - ${err.message}`)
    }
  }

  const startBarcodeScanning = () => {
    if (!videoRef.current) return

    console.log("🔍 Starting barcode scanning...")
    scanningRef.current = true
    readerRef.current = new BrowserMultiFormatReader()

    const scanLoop = async () => {
      if (!scanningRef.current || !readerRef.current || !videoRef.current) return

      try {
        const result = await readerRef.current.decodeOnceFromVideoElement(videoRef.current)
        console.log("📱 Barcode detected:", result.getText())
        onScanResult(result.getText())
        stopCamera()
      } catch (err) {
        // No barcode found, continue scanning
        if (scanningRef.current) {
          setTimeout(scanLoop, 100)
        }
      }
    }

    scanLoop()
  }

  const stopCamera = () => {
    console.log("🛑 Stopping camera...")
    scanningRef.current = false

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log("🔌 Stopping track:", track.kind)
        track.stop()
      })
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    if (readerRef.current) {
      readerRef.current = null
    }

    setIsActive(false)
    setStreamInfo("")
    setTorchOn(false)
  }

  const toggleTorch = async () => {
    if (!streamRef.current) return

    const track = streamRef.current.getVideoTracks()[0]
    const capabilities = track.getCapabilities()

    if ("torch" in capabilities) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !torchOn } as any]
        })
        setTorchOn(!torchOn)
        console.log("🔦 Torch toggled:", !torchOn)
      } catch (err) {
        console.error("❌ Torch toggle failed:", err)
      }
    }
  }

  const switchCamera = async () => {
    if (isActive) {
      stopCamera()
      setFacingMode(facingMode === "environment" ? "user" : "environment")
      // Small delay to ensure camera is fully stopped
      setTimeout(() => {
        startCamera()
      }, 100)
    } else {
      setFacingMode(facingMode === "environment" ? "user" : "environment")
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Camera Container */}
      <div className="relative w-full aspect-video bg-black/20 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover bg-red-500"
          style={{
            transform: "scaleX(-1)", // Mirror the video
            backgroundColor: "#000"
          }}
          onLoadedMetadata={() => {
            console.log("📊 Video metadata loaded")
            if (videoRef.current) {
              console.log("📐 Video size:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight)
            }
          }}
          onCanPlay={() => console.log("✅ Video can play")}
          onPlay={() => console.log("▶️ Video play event")}
          onError={(e) => console.error("❌ Video error event:", e)}
        />

        {/* Scanning Frame Overlay (only when active) */}
        {isActive && (
          <>
            <div className="absolute inset-0 border-2 border-blue-400/50 rounded-2xl">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-32 border-2 border-blue-400 rounded-lg">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>
              </div>
            </div>
            <div className="absolute top-4 left-4 bg-green-500/80 text-white px-3 py-1 rounded-full text-sm font-medium">
              🔍 Scanning...
            </div>
          </>
        )}

        {/* Camera Icon when inactive */}
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Camera className="w-16 h-16 text-white/40" />
          </div>
        )}

        {/* Debug overlay */}
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs p-2 rounded">
          Status: {isActive ? "🟢 Active" : "🔴 Inactive"}
          <br />
          Camera: {facingMode === "environment" ? "📷 Back" : "🤳 Front"}
        </div>
      </div>

      {/* Stream Info */}
      {streamInfo && (
        <div className="text-green-400 text-sm bg-green-900/20 p-2 rounded">
          {streamInfo}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="text-red-400 bg-red-900/20 border border-red-500/20 rounded p-3">
          <AlertCircle className="w-4 h-4 inline mr-2" />
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={isActive ? stopCamera : startCamera}
          disabled={false}
          className="flex-1 px-6 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-xl font-semibold transition-all duration-150 flex items-center justify-center gap-2 shadow-[0_4px_0_0_#d1d5db] hover:shadow-[0_2px_0_0_#d1d5db] hover:translate-y-[2px] active:shadow-[0_0px_0_0_#d1d5db] active:translate-y-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Camera className="w-5 h-5" />
          {isActive ? "Stop Scan" : "Start Scan"}
        </button>

        <button
          onClick={switchCamera}
          className="px-4 py-3 bg-blue-400 text-white border-2 border-blue-500 rounded-xl font-semibold transition-all duration-150 shadow-[0_4px_0_0_#3b82f6] hover:shadow-[0_2px_0_0_#3b82f6] hover:translate-y-[2px] active:shadow-[0_0px_0_0_#3b82f6] active:translate-y-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          title={`Switch to ${facingMode === "environment" ? "front" : "back"} camera`}
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {isActive && (
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