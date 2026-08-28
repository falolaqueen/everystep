"use client";

import {
  ArrowDown,
  ArrowRight,
  Heart,
  Instagram,
  Menu,
  Sparkles,
  Star,
  X,
} from "lucide-react";

import { useState } from "react";
import ColorPlayground from "@/component/ColorPlayground";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-hidden bg-[#faf8f2] text-[#171717]">

      {/* NAVIGATION */}

      <nav className="fixed left-1/2 top-4 z-50 flex w-[calc(100%-32px)] max-w-6xl -translate-x-1/2 items-center justify-between rounded-full border border-black/5 bg-white/80 px-5 py-3 shadow-sm backdrop-blur-xl">

        <a
          href="#"
          className="text-xl font-black tracking-[-0.05em]"
        >
          every<span className="text-[#F4A261]">step</span>.
        </a>

        <div className="hidden items-center gap-8 text-sm font-medium md:flex">
          <a href="#playground" className="transition hover:text-[#F4A261]">
            Colour Playground
          </a>

          <a href="#about" className="transition hover:text-[#F4A261]">
            Our Story
          </a>

          <a href="#shop" className="transition hover:text-[#F4A261]">
            Shop
          </a>
        </div>

        <a
          href="#playground"
          className="hidden rounded-full bg-[#171717] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#F4A261] hover:text-[#171717] sm:block"
        >
          Find your colour
        </a>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-full p-2 md:hidden"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

      </nav>

      {menuOpen && (
        <div className="fixed left-4 right-4 top-20 z-40 rounded-3xl border border-black/5 bg-white p-6 shadow-xl md:hidden">
          <div className="flex flex-col gap-5 text-lg font-semibold">
            <a href="#playground" onClick={() => setMenuOpen(false)}>
              Colour Playground
            </a>

            <a href="#about" onClick={() => setMenuOpen(false)}>
              Our Story
            </a>

            <a href="#shop" onClick={() => setMenuOpen(false)}>
              Shop
            </a>
          </div>
        </div>
      )}

      {/* HERO */}

      <section className="relative flex min-h-screen items-center px-5 pb-20 pt-32 sm:px-8">

        <div className="absolute left-[-120px] top-40 h-72 w-72 rounded-full bg-[#F4A261] opacity-60 blur-3xl" />

        <div className="absolute bottom-10 right-[-100px] h-96 w-96 rounded-full bg-[#f4c9d9] opacity-40 blur-3xl" />

        <div className="mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-2">

          <div className="relative z-10">

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#F4A261]/30 bg-[#f4e1d1] px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[#C9683F]">
              <Sparkles size={14} />
              Handmade in Nigeria
            </div>

            <h1 className="max-w-3xl text-[clamp(3.5rem,8vw,7rem)] font-black leading-[0.88] tracking-[-0.075em]">
              Your feet.
              <br />
              <span className="text-[#F4A261]">Your colour.</span>
              <br />
              Your step.
            </h1>

            <p className="mt-8 max-w-lg text-base leading-7 text-black/55 sm:text-lg">
              Beautiful handmade footwear designed in Nigeria.
              Upload a style, play with the colours and find the
              one that feels like you.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">

              <a
                href="#playground"
                className="group flex items-center gap-3 rounded-full bg-[#171717] px-6 py-4 font-bold text-white transition hover:-translate-y-1"
              >
                Play with colours

                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F4A261] text-black transition group-hover:rotate-45">
                  <ArrowRight size={15} />
                </span>
              </a>

              <a
                href="#about"
                className="flex items-center rounded-full border border-black/10 bg-white px-6 py-4 font-bold transition hover:-translate-y-1"
              >
                Our story
              </a>

            </div>

            <div className="mt-12 flex items-center gap-3">

              <div className="flex -space-x-2">
                {["#f5b7d2", "#F4A261", "#b8d8ff", "#f5d49a"].map(
                  (color) => (
                    <span
                      key={color}
                      className="h-8 w-8 rounded-full border-2 border-[#faf8f2]"
                      style={{ backgroundColor: color }}
                    />
                  )
                )}
              </div>

              <p className="text-sm text-black/50">
                Made for every kind of step.
              </p>

            </div>

          </div>

          {/* HERO VISUAL */}

          <div className="relative">

            <div className="absolute -right-4 top-10 z-10 rotate-6 rounded-2xl bg-[#171717] px-5 py-3 text-sm font-bold text-white shadow-xl">
              made by hand ♡
            </div>

            <div className="relative aspect-square overflow-hidden rounded-[3rem] bg-[#FFF3E8]">

              <div className="absolute inset-0 flex items-center justify-center">

                <div className="rotate-[-12deg] text-[180px] drop-shadow-2xl transition duration-500 hover:rotate-[-5deg] hover:scale-105 sm:text-[240px]">
                  🥿
                </div>

              </div>

              <div className="absolute bottom-7 left-7 rounded-2xl bg-white/80 px-5 py-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-widest text-black/40">
                  Today's mood
                </p>

                <p className="mt-1 font-black">
                  Soft & playful
                </p>
              </div>

            </div>

          </div>

        </div>

        <a
          href="#playground"
          className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 animate-bounce md:block"
        >
          <ArrowDown size={22} />
        </a>

      </section>

    

      {/* FEATURES */}

      <section className="px-5 py-24 sm:px-8">

        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">

          <Feature
            number="01"
            title="Pick a style"
            text="Choose one of our handmade designs or upload your own."
          />

          <Feature
            number="02"
            title="Play with colour"
            text="Try different colours until you find one that feels right."
          />

          <Feature
            number="03"
            title="Make it yours"
            text="Save your favourite combination and send it to us."
          />

        </div>

      </section>

        {/* PLAYGROUND */}

      <section
        id="playground"
        className="scroll-mt-24 bg-[#171717] px-5 py-24 text-white sm:px-8"
      >

        <div className="mx-auto max-w-6xl">

          <div className="mb-14 max-w-2xl">

            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#F4A261]">
              The colour playground
            </p>

            <h2 className="text-4xl font-black tracking-[-0.04em] sm:text-6xl">
              What if it came
              <br />
              in <span className="text-pink-400">pink?</span>
            </h2>

            <p className="mt-5 max-w-xl leading-7 text-white/50">
              Upload a picture of your slipper, select the part
              you want to change and start playing.
            </p>

          </div>

          <ColorPlayground />

        </div>

      </section>

      {/* ABOUT */}

      <section
        id="about"
        className="scroll-mt-24 px-5 py-24 sm:px-8"
      >

        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">

          <div className="rounded-[3rem] bg-[#f5d9e5] p-10 sm:p-16">

            <div className="text-[120px] sm:text-[180px]">
              👡
            </div>

          </div>

          <div>

            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#C9683F]">
              Our story
            </p>

            <h2 className="text-4xl font-black tracking-[-0.05em] sm:text-6xl">
              Made slowly.
              <br />
              Made beautifully.
            </h2>

            <p className="mt-7 leading-8 text-black/60">
              Every Step is a Nigerian handmade footwear brand
              built around one simple idea: you shouldn't break the bank to own a <span className="text-[#F4A261]">step</span> of the piece.
            </p>

            <p className="mt-5 leading-8 text-black/60">
              From the colours we choose to the details we finish
              by hand, every pair is made with intention.
            </p>

            <div className="mt-8 flex items-center gap-2">
              <Star
                size={17}
                fill="#F4A261"
                className="text-[#F4A261]"
              />

              <Star
                size={17}
                fill="#F4A261"
                className="text-[#F4A261]"
              />

              <Star
                size={17}
                fill="#F4A261"
                className="text-[#F4A261]"
              />

              <Star
                size={17}
                fill="#F4A261"
                className="text-[#F4A261]"
              />

              <Star
                size={17}
                fill="#F4A261"
                className="text-[#F4A261]"
              />

              <span className="ml-2 text-sm font-semibold">
                handmade with love
              </span>
            </div>

          </div>

        </div>

      </section>

      {/* SHOP CTA */}

      <section
        id="shop"
        className="px-5 pb-24 sm:px-8"
      >

        <div className="mx-auto max-w-6xl overflow-hidden rounded-[3rem] bg-[#F4A261] px-7 py-16 text-center sm:px-12">

          <Heart
            className="mx-auto mb-5"
            size={28}
            fill="currentColor"
          />

          <h2 className="mx-auto max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-6xl">
            Found a colour you love?
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-black/60">
            Send us your favourite combination and let's make
            your pair.
          </p>

          <a
            href="https://wa.me/+23463186020"
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex rounded-full bg-[#171717] px-7 py-4 font-bold text-white transition hover:-translate-y-1"
          >
            Order on WhatsApp
          </a>

        </div>

      </section>

      {/* FOOTER */}

      <footer className="border-t border-black/5 px-5 py-10 sm:px-8">

        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-xl font-black tracking-[-0.05em]">
              every<span className="text-[#F4A261]">step</span>.
            </p>

            <p className="mt-1 text-sm text-black/40">
              Handmade footwear from Nigeria.
            </p>
          </div>

          <a
            href="#"
            className="flex items-center gap-2 text-sm font-semibold"
          >
            {/* <Instagram size={17} /> */}
            @everyy.step_
          </a>

        </div>

      </footer>

    </main>
  );
}

function Feature({ number, title, text }) {
  return (
    <div className="rounded-[2rem] border border-black/5 bg-white p-8 transition duration-300 hover:-translate-y-2 hover:shadow-xl">

      <span className="text-sm font-black text-[#F4A261]">
        {number}
      </span>

      <h3 className="mt-12 text-2xl font-black">
        {title}
      </h3>

      <p className="mt-3 leading-7 text-black/50">
        {text}
      </p>

    </div>
  );
}