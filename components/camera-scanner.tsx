"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, Flashlight, FlashlightOff, AlertCircle, RefreshCw } from "lucide-react"
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
  }, [])

  const checkBrowserSupport = () => {
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

  const requestCameraPermission = async () => {
    if (!checkBrowserSupport()) return false

    try {
      console.log("[v0] Requesting camera permission...")
      setError("")

      // Request basic camera access to get permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
      })

      console.log("[v0] Camera permission granted successfully")

      // Stop the temporary stream
      stream.getTracks().forEach((track) => track.stop())

      setPermissionState("granted")

      // Now enumerate devices after getting permission
      await enumerateDevices()

      return true
    } catch (err: any) {
      console.error("[v0] Camera permission failed:", err.name, err.message)

      if (err.name === "NotAllowedError") {
        setPermissionState("denied")
        setError("Camera permission denied. Please allow camera access and try again.")
      } else if (err.name === "NotFoundError") {
        setError("No camera found. Please check that your device has a camera and try again.")
      } else if (err.name === "NotReadableError") {
        setError("Camera is being used by another application. Please close other apps and try again.")
      } else {
        setError(`Camera access failed: ${err.message}. Please check your browser settings.`)
      }

      return false
    }
  }

  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((device) => device.kind === "videoinput")

      console.log("[v0] Available camera devices:", videoDevices.length)
      setAvailableDevices(videoDevices)

      if (videoDevices.length === 0) {
        setError("No camera devices found. Please check your device has a camera.")
        return
      }

      // Select back camera if available
      const backCamera = videoDevices.find(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("environment") ||
          device.label.toLowerCase().includes("rear"),
      )

      const selectedDevice = backCamera || videoDevices[0]
      setSelectedDeviceId(selectedDevice.deviceId)
      console.log("[v0] Selected camera:", selectedDevice.label || "Unknown camera")
    } catch (err: any) {
      console.error("[v0] Failed to enumerate devices:", err)
      setError("Failed to list camera devices. Please refresh and try again.")
    }
  }

  const startCamera = async () => {
    try {
      console.log("[v0] Starting camera...")
      setError("")

      // Request permission first if not granted
      if (permissionState !== "granted") {
        const permissionGranted = await requestCameraPermission()
        if (!permissionGranted) return
      }

      // Use selected device or fallback to basic constraints
      const constraints: MediaStreamConstraints = selectedDeviceId
        ? {
            video: {
              deviceId: { exact: selectedDeviceId },
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
            },
          }
        : {
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
            },
          }

      console.log("[v0] Getting camera stream...")
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log("[v0] Camera stream obtained successfully")

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream

        videoRef.current.style.display = "block"
        videoRef.current.style.visibility = "visible"

        console.log("[v0] Stream attached to video element")
        setIsScanning(true)
        scanningRef.current = true

        readerRef.current = new BrowserMultiFormatReader()

        await new Promise<void>((resolve, reject) => {
          if (videoRef.current) {
            const video = videoRef.current

            const onLoadedMetadata = () => {
              console.log("[v0] Video metadata loaded, dimensions:", video.videoWidth, "x", video.videoHeight)
              video
                .play()
                .then(() => {
                  console.log("[v0] Video playing successfully")
                  console.log("[v0] Video readyState:", video.readyState)
                  console.log("[v0] Video paused:", video.paused)
                  resolve()
                })
                .catch((playError) => {
                  console.error("[v0] Video play failed:", playError)
                  reject(playError)
                })
            }

            const onCanPlay = () => {
              console.log("[v0] Video can play")
            }

            const onError = (e: Event) => {
              console.error("[v0] Video error:", e)
              reject(new Error("Video failed to load"))
            }

            video.addEventListener("loadedmetadata", onLoadedMetadata, { once: true })
            video.addEventListener("canplay", onCanPlay, { once: true })
            video.addEventListener("error", onError, { once: true })

            setTimeout(() => {
              video.removeEventListener("loadedmetadata", onLoadedMetadata)
              video.removeEventListener("canplay", onCanPlay)
              video.removeEventListener("error", onError)
              console.log("[v0] Video setup timeout reached")
              resolve()
            }, 5000)
          }
        })

        // Start scanning after a short delay
        setTimeout(() => {
          startContinuousScanning()
        }, 500)
      }
    } catch (err: any) {
      console.error("[v0] Camera start error:", err)

      if (err.name === "NotAllowedError") {
        setError("Camera permission denied. Please allow camera access and try again.")
        setPermissionState("denied")
      } else if (err.name === "NotFoundError") {
        setError("Camera not found. Please check your device and try again.")
      } else if (err.name === "NotReadableError") {
        setError("Camera is being used by another application.")
      } else if (err.name === "OverconstrainedError") {
        // Try with basic constraints
        console.log("[v0] Trying with basic camera constraints...")
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
          setError("Camera access failed. Please check your device and permissions.")
        }
      } else {
        setError(`Camera error: ${err.message}`)
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

  const retryPermission = () => {
    setError("")
    setPermissionState("unknown")
    setAvailableDevices([])
    setSelectedDeviceId("")
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
        <div className="text-red-400 text-center text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Camera permission denied. Please enable camera access:
          </div>
          <div className="text-xs text-red-300 space-y-1">
            <p>1. Tap the camera icon in your browser's address bar</p>
            <p>2. Select "Allow" for camera access</p>
            <p>3. Or go to Settings → Site Settings → Camera → Allow</p>
          </div>
          <button
            onClick={retryPermission}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 mx-auto hover:bg-red-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
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
              className="w-full h-full object-cover"
              style={{
                transform: "scaleX(-1)",
                backgroundColor: "#000",
                minHeight: "100%",
                minWidth: "100%",
              }}
              onLoadedMetadata={() => console.log("[v0] Video metadata loaded in JSX")}
              onCanPlay={() => console.log("[v0] Video can play in JSX")}
              onPlay={() => console.log("[v0] Video started playing in JSX")}
              onError={(e) => console.error("[v0] Video error in JSX:", e)}
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
