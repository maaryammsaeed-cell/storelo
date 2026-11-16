"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Star, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section
      id="home"
      className="relative w-full min-h-[85vh] bg-[#F3EADF] overflow-hidden flex items-center py-12"
    >
      {/* Animated Background Glowing Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-20 -left-20 w-[450px] h-[450px] rounded-full bg-[#EAD6D9]/50 blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="pointer-events-none absolute -bottom-20 right-0 w-[400px] h-[400px] rounded-full bg-[#E3D0C9]/50 blur-3xl"
      />

      <div className="max-w-7xl mx-auto w-full px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Content Column */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-6 space-y-6"
        >
          {/* Animated Pill Badge */}
          <motion.div variants={itemVariants}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-[#E5D5D0] text-xs font-semibold tracking-widest uppercase text-[#6D4C52] shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#A86B74] animate-spin" style={{ animationDuration: '4s' }} />
              <span>New Season • 2026 Luxury Edit</span>
            </motion.div>
          </motion.div>

          {/* Editorial Main Heading with Fade Animation */}
          <motion.h1
            variants={itemVariants}
            className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.12] text-[#2C2523] tracking-tight"
          >
            Style That Speaks, <br />
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="italic font-normal text-[#836c50] inline-block"
            >
              Elegance
            </motion.span>{" "}
            That Lasts.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg text-[#5C534F] max-w-lg leading-relaxed"
          >
            Discover the perfect blend of fashion and elegance with our curated collection of premium dresses, shoes, and signature bags. Express your unique style effortlessly.
          </motion.p>

          {/* Interactive CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="pt-2 flex flex-wrap items-center gap-4"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="#products"
                className="group inline-flex items-center gap-2.5 bg-[#3D362D] hover:bg-[#2A251F] text-white px-8 py-4 rounded-full text-sm font-medium tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <span>Explore Collection</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="#services"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-full text-sm font-medium text-[#3D362D] border border-[#D4C5BE] bg-white/40 hover:bg-white/80 backdrop-blur-md transition-all duration-300"
              >
                <span>Our Services</span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div variants={itemVariants} className="pt-4 flex items-center gap-6 text-xs text-[#7A6F6B]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#A86B74]" />
              <span>100% Original Quality</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-[#A86B74] fill-[#A86B74]" />
              <span>Loved by Fashionistas</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Visual Column with Floating Badges */}
        <div className="lg:col-span-6 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-white/80 aspect-[4/3] lg:aspect-[5/4] group"
          >
            {/* Dynamic Slow Zoom Image Animation */}
            <motion.img
              src="/images/hero/hero-main.jpg"
              alt="MEEM Luxury Fashion"
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{
                duration: 9,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
          </motion.div>

          {/* Floating Glassmorphism Badge 1 (Bottom Left) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: [0, -10, 0] }}
            transition={{
              opacity: { duration: 0.8, delay: 0.5 },
              y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            }}
            className="absolute -bottom-6 -left-6 sm:flex items-center gap-3.5 bg-white/90 backdrop-blur-xl border border-white px-5 py-4 rounded-2xl shadow-xl z-20 hidden"
          >
            <div className="w-11 h-11 rounded-full bg-[#F5E6E8] flex items-center justify-center text-[#A86B74] font-serif font-bold text-lg shadow-inner">
              M
            </div>
            <div>
              <p className="text-xs font-bold text-[#2C2523]">MEEM Signature</p>
              <p className="text-[11px] text-[#7A6F6B]">Exclusive Trendsetters</p>
            </div>
          </motion.div>

          {/* Floating Glassmorphism Badge 2 (Top Right) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: [1, 1.05, 1] }}
            transition={{
              opacity: { duration: 0.8, delay: 0.7 },
              scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            }}
            className="absolute -top-4 -right-4 sm:flex items-center gap-2 bg-white/90 backdrop-blur-xl border border-white px-4 py-2.5 rounded-full shadow-lg z-20 hidden"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-[#2C2523]">Trending Now</span>
          </motion.div>

        </div>

      </div>
    </section>
  );
}