"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, Flashlight, FlashlightOff, AlertCircle } from "lucide-react"
import { BrowserMultiFormatReader } from "@zxing/browser"

interface CameraScannerProps {
  onScanResult: (imei: string) => void
}

export function CameraScanner({ onScanResult }: CameraScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [error, setError] = useState("")
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")
  const [permissionState, setPermissionState] = useState<"unknown" | "granted" | "denied">("unknown")
  const [isClient, setIsClient] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const scanningRef = useRef<boolean>(false)

  useEffect(() => {
    setIsClient(true)

    const checkSecureContext = () => {
      if (typeof window === "undefined") return false

      if (!window.isSecureContext) {
        setError("Camera access requires HTTPS. Please use a secure connection.")
        return false
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Camera access is not supported in this browser.")
        return false
      }

      return true
    }

    const initializeDevices = async () => {
      if (!checkSecureContext()) return

      try {
        console.log("[v0] Checking camera permissions...")

        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ video: true })
          tempStream.getTracks().forEach((track) => track.stop())
          setPermissionState("granted")
          console.log("[v0] Camera permission granted")
        } catch (permErr: any) {
          console.log("[v0] Camera permission check failed:", permErr.name)
          if (permErr.name === "NotAllowedError") {
            setPermissionState("denied")
            setError(
              "Camera permission denied. Please allow camera access in your browser settings and refresh the page.",
            )
            return
          }
        }

        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter((device) => device.kind === "videoinput")

        console.log("[v0] Available camera devices:", videoDevices)
        setAvailableDevices(videoDevices)

        if (videoDevices.length === 0) {
          setError("No camera devices found. Please check your device has a camera.")
          return
        }

        const backCamera = videoDevices.find(
          (device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("environment") ||
            device.label.toLowerCase().includes("rear"),
        )

        const selectedDevice = backCamera || videoDevices[0]
        setSelectedDeviceId(selectedDevice.deviceId)
        console.log("[v0] Selected camera:", selectedDevice.label || selectedDevice.deviceId)
      } catch (err: any) {
        console.error("[v0] Failed to initialize camera devices:", err)
        setError(`Unable to access camera: ${err.message}`)
      }
    }

    initializeDevices()
  }, [])

  const startCamera = async () => {
    try {
      console.log("[v0] Starting camera with device:", selectedDeviceId)
      setError("")

      if (!selectedDeviceId && availableDevices.length === 0) {
        setError("No camera available. Please check your device and permissions.")
        return
      }

      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? {
              deviceId: { exact: selectedDeviceId },
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
            }
          : {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
            },
      }

      console.log("[v0] Requesting camera with constraints:", constraints)
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log("[v0] Camera stream obtained successfully")

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)
        scanningRef.current = true

        readerRef.current = new BrowserMultiFormatReader()

        await new Promise<void>((resolve, reject) => {
          if (videoRef.current) {
            const video = videoRef.current

            const onLoadedMetadata = () => {
              console.log("[v0] Video metadata loaded, starting playback")
              video
                .play()
                .then(() => {
                  console.log("[v0] Video playing successfully")
                  resolve()
                })
                .catch(reject)
            }

            const onError = (e: Event) => {
              console.error("[v0] Video error:", e)
              reject(new Error("Video failed to load"))
            }

            video.addEventListener("loadedmetadata", onLoadedMetadata, { once: true })
            video.addEventListener("error", onError, { once: true })

            // Timeout fallback
            setTimeout(() => {
              video.removeEventListener("loadedmetadata", onLoadedMetadata)
              video.removeEventListener("error", onError)
              resolve() // Continue even if metadata doesn't load
            }, 3000)
          }
        })

        setTimeout(() => {
          startContinuousScanning()
        }, 500)
      }
    } catch (err: any) {
      console.error("[v0] Camera error:", err)

      if (err.name === "NotAllowedError") {
        setError("Camera permission denied. Please allow camera access and refresh the page.")
        setPermissionState("denied")
      } else if (err.name === "NotFoundError") {
        setError("No camera found. Please check your device has a camera.")
      } else if (err.name === "NotReadableError") {
        setError("Camera is being used by another application.")
      } else if (err.name === "OverconstrainedError") {
        setError("Camera constraints not supported. Trying with basic settings...")
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({ video: true })
          if (videoRef.current) {
            videoRef.current.srcObject = basicStream
            streamRef.current = basicStream
            setIsScanning(true)
            scanningRef.current = true
            readerRef.current = new BrowserMultiFormatReader()
            setTimeout(() => startContinuousScanning(), 500)
          }
        } catch (basicErr) {
          setError("Camera access failed completely. Please check your device and permissions.")
        }
      } else {
        setError(`Camera access failed: ${err.message}`)
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
    if (videoRef.current) {
      videoRef.current.srcObject = null
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

  if (!isClient) {
    return (
      <div className="space-y-4">
        <div className="relative w-full aspect-video bg-black/20 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-center h-full">
            <Camera className="w-16 h-16 text-white/40" />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            disabled
            className="flex-1 px-6 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-xl font-semibold transition-all duration-150 flex items-center justify-center gap-2 shadow-[0_4px_0_0_#d1d5db] opacity-50 cursor-not-allowed"
          >
            <Camera className="w-5 h-5" />
            Loading...
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {typeof window !== "undefined" && !window.isSecureContext && (
        <div className="text-amber-400 text-center text-sm bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Camera requires HTTPS. Please use a secure connection.
        </div>
      )}

      {permissionState === "denied" && (
        <div className="text-red-400 text-center text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Camera permission denied. Please enable camera access in your browser settings and refresh the page.
        </div>
      )}

      {availableDevices.length > 1 && !isScanning && permissionState === "granted" && (
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
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover bg-black"
              style={{ transform: "scaleX(-1)" }} // Mirror for better UX
            />
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
          disabled={permissionState === "denied" || (!selectedDeviceId && availableDevices.length === 0)}
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
