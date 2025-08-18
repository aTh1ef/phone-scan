"use client"

import type * as React from "react"
import { motion } from "framer-motion"
import { Scan, Edit3, History } from "lucide-react"

interface MenuItem {
  icon: React.ReactNode
  label: string
  value: "scanner" | "manual" | "history"
  gradient: string
  iconColor: string
}

const menuItems: MenuItem[] = [
  {
    icon: <Scan className="h-5 w-5" />,
    label: "Scanner",
    value: "scanner",
    gradient: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
    iconColor: "text-blue-500",
  },
  {
    icon: <Edit3 className="h-5 w-5" />,
    label: "Manual",
    value: "manual",
    gradient: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
    iconColor: "text-orange-500",
  },
  {
    icon: <History className="h-5 w-5" />,
    label: "History",
    value: "history",
    gradient: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
    iconColor: "text-green-500",
  },
]

const itemVariants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
}

const backVariants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
}

const glowVariants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 0.5, type: "spring", stiffness: 300, damping: 25 },
    },
  },
}

const navGlowVariants = {
  initial: { opacity: 0 },
  hover: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
}

const sharedTransition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  duration: 0.5,
}

interface PhoneMenuBarProps {
  currentView: "scanner" | "manual" | "history"
  onViewChange: (view: "scanner" | "manual" | "history") => void
}

export function PhoneMenuBar({ currentView, onViewChange }: PhoneMenuBarProps) {
  const getIndicatorPosition = () => {
    const index = menuItems.findIndex((item) => item.value === currentView)
    return index * 100 // Each item takes 100% width in flex layout
  }

  return (
    <motion.nav
      className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-lg border border-white/20 shadow-lg relative overflow-hidden w-full max-w-sm"
      initial="initial"
      whileHover="hover"
    >
      <motion.div
        className="absolute -inset-2 bg-gradient-radial from-transparent via-blue-400/20 via-30% via-purple-400/20 via-60% via-red-400/20 via-90% to-transparent rounded-3xl z-0 pointer-events-none"
        variants={navGlowVariants}
      />

      <motion.div
        className="absolute top-1.5 sm:top-2 bottom-1.5 sm:bottom-2 bg-white/20 rounded-lg sm:rounded-xl z-5 pointer-events-none"
        animate={{
          x: `${getIndicatorPosition()}%`,
          width: `${100 / menuItems.length}%`,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: 0.6,
        }}
        style={{
          left: "0.375rem",
          right: "0.375rem",
          width: `calc(${100 / menuItems.length}% - 0.1875rem)`,
        }}
      />

      <ul className="flex items-center gap-1 sm:gap-2 relative z-10">
        {menuItems.map((item) => {
          const isActive = currentView === item.value

          return (
            <motion.li key={item.label} className="relative flex-1">
              <motion.div
                className="block rounded-lg sm:rounded-xl overflow-visible group relative"
                style={{ perspective: "600px" }}
                whileHover="hover"
                initial="initial"
                animate={isActive ? "hover" : "initial"}
              >
                <motion.div
                  className="absolute inset-0 z-0 pointer-events-none"
                  variants={glowVariants}
                  style={{
                    background: item.gradient,
                    opacity: 0,
                    borderRadius: "16px",
                  }}
                  animate={isActive ? "hover" : "initial"}
                />
                <motion.button
                  onClick={() => onViewChange(item.value)}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-2 relative z-10 bg-transparent transition-colors rounded-lg sm:rounded-xl w-full min-h-[44px] ${
                    currentView === item.value ? "text-white" : "text-white/70 hover:text-white"
                  }`}
                  variants={itemVariants}
                  transition={sharedTransition}
                  style={{ transformStyle: "preserve-3d", transformOrigin: "center bottom" }}
                >
                  <span
                    className={`transition-colors duration-300 group-hover:${item.iconColor} ${isActive ? item.iconColor : ""}`}
                  >
                    {item.icon}
                  </span>
                  <span className="font-montserrat font-semibold text-xs sm:text-sm">{item.label}</span>
                </motion.button>
                <motion.button
                  onClick={() => onViewChange(item.value)}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-2 absolute inset-0 z-10 bg-transparent transition-colors rounded-lg sm:rounded-xl w-full min-h-[44px] ${
                    currentView === item.value ? "text-white" : "text-white/70 hover:text-white"
                  }`}
                  variants={backVariants}
                  transition={sharedTransition}
                  style={{ transformStyle: "preserve-3d", transformOrigin: "center top", rotateX: 90 }}
                >
                  <span
                    className={`transition-colors duration-300 group-hover:${item.iconColor} ${isActive ? item.iconColor : ""}`}
                  >
                    {item.icon}
                  </span>
                  <span className="font-montserrat font-semibold text-xs sm:text-sm">{item.label}</span>
                </motion.button>
              </motion.div>
            </motion.li>
          )
        })}
      </ul>
    </motion.nav>
  )
}
