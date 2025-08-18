"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, Flashlight, FlashlightOff } from "lucide-react"
import { BrowserMultiFormatReader, BrowserCodeReader } from "@zxing/browser"

interface CameraScannerProps {
  onScanResult: (imei: string) => void
}

export function CameraScanner({ onScanResult }: CameraScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [error, setError] = useState("")
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const scanningRef = useRef<boolean>(false)

  useEffect(() => {
    const initializeDevices = async () => {
      try {
        const devices = await BrowserCodeReader.listVideoInputDevices()
        console.log("[v0] Available camera devices:", devices)
        setAvailableDevices(devices)

        // Prefer back camera if available
        const backCamera = devices.find(
          (device) => device.label.toLowerCase().includes("back") || device.label.toLowerCase().includes("environment"),
        )
        setSelectedDeviceId(backCamera?.deviceId || devices[0]?.deviceId || "")
      } catch (err) {
        console.error("[v0] Failed to list camera devices:", err)
        setError("Unable to access camera devices")
      }
    }

    initializeDevices()
  }, [])

  const startCamera = async () => {
    try {
      console.log("[v0] Starting camera with device:", selectedDeviceId)
      setError("")

      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
            },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log("[v0] Camera stream obtained successfully")

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)
        scanningRef.current = true

        readerRef.current = new BrowserMultiFormatReader()

        // Wait for video to be ready
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => resolve(void 0)
          }
        })

        startContinuousScanning()
      }
    } catch (err: any) {
      console.error("[v0] Camera error:", err)

      if (err.name === "NotAllowedError") {
        setError("Camera permission denied. Please allow camera access and try again.")
      } else if (err.name === "NotFoundError") {
        setError("No camera found. Please check your device has a camera.")
      } else if (err.name === "NotReadableError") {
        setError("Camera is being used by another application.")
      } else {
        setError("Camera access failed. Please try again.")
      }
    }
  }

  const startContinuousScanning = async () => {
    if (!readerRef.current || !videoRef.current || !scanningRef.current) return

    try {
      const result = await readerRef.current.decodeOnceFromVideoElement(videoRef.current)
      console.log("[v0] Barcode detected:", result.text)
      onScanResult(result.text)
      stopCamera()
    } catch (err) {
      // Continue scanning if no barcode detected
      if (scanningRef.current) {
        setTimeout(() => startContinuousScanning(), 100)
      }
    }
  }

  const stopCamera = () => {
    console.log("[v0] Stopping camera")
    scanningRef.current = false

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
          console.log("[v0] Torch toggled:", !torchOn)
        } catch (err) {
          console.error("[v0] Torch toggle failed:", err)
        }
      } else {
        console.log("[v0] Torch not supported on this device")
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
      {availableDevices.length > 1 && !isScanning && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">Select Camera:</label>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId} className="bg-gray-800">
                {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      )}

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
            <div className="absolute top-4 left-4 bg-green-500/80 text-white px-3 py-1 rounded-full text-sm font-medium">
              Scanning...
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Camera className="w-16 h-16 text-white/40" />
          </div>
        )}
      </div>

      {error && (
        <div className="text-red-400 text-center text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={isScanning ? stopCamera : startCamera}
          disabled={!selectedDeviceId && availableDevices.length === 0}
          className="flex-1 px-6 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-xl font-semibold transition-all duration-150 flex items-center justify-center gap-2 shadow-[0_4px_0_0_#d1d5db] hover:shadow-[0_2px_0_0_#d1d5db] hover:translate-y-[2px] active:shadow-[0_0px_0_0_#d1d5db] active:translate-y-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
