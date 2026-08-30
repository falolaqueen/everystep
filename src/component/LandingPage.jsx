import Link from "next/link";
import Image from "next/image";
import ColorPlayground from "./ColorPlayground";
import {
  Sparkles,
  ArrowDown,
  ArrowRight,
  Heart,
  Send,
  Menu,
  Star,
  X,
  ShoppingBasket
} from "lucide-react";

import Navbar from "./Navbar";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FFF9F4]">

      <Navbar />

      {/* HERO */}
      <section className="relative flex min-h-screen items-center px-5 pb-16 pt-28 sm:px-8 lg:min-h-[calc(100vh-80px)] lg:pb-12 lg:pt-24 xl:pt-28">

        <div className="absolute left-[-120px] top-40 h-72 w-72 rounded-full bg-[#F4A261] opacity-60 blur-3xl" />

        <div className="absolute bottom-10 right-[-100px] h-96 w-96 rounded-full bg-[#f4c9d9] opacity-40 blur-3xl" />

        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-8 xl:gap-14">

          <div className="relative z-10">

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#F4A261]/30 bg-[#f4e1d1] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#C9683F] sm:text-xs">
              <Sparkles size={14} />
              Handmade in Nigeria
            </div>

            <h1 className="max-w-3xl text-[clamp(3rem,6vw,6rem)] font-black leading-[0.9] tracking-[-0.075em] lg:text-[clamp(3.2rem,5vw,5rem)] xl:text-[clamp(3.5rem,6vw,6rem)]">
              Your feet.
              <br />
              <span className="text-[#F4A261]">Your colour.</span>
              <br />
              Your step.
            </h1>

            <p className="mt-6 max-w-lg text-sm leading-7 text-black/55 sm:text-base lg:max-w-md xl:max-w-lg xl:text-lg">
              Beautiful handmade footwear designed in Nigeria.
              Upload a style, play with the colours and find the
              one that feels like you.
            </p>

            <div className="mt-7 flex flex-wrap gap-3 sm:mt-8">

              <a
                href="#playground"
                className="group flex items-center gap-3 rounded-full bg-[#171717] px-5 py-3.5 text-sm font-bold text-white transition hover:-translate-y-1 sm:px-6 sm:py-4 sm:text-base"
              >
                Play with colours

                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F4A261] text-black transition group-hover:rotate-45">
                  <ArrowRight size={15} />
                </span>
              </a>

              <Link
                href="/shop"
                className="flex items-center rounded-full border border-black/10 bg-white px-5 py-3.5 text-sm font-bold transition hover:-translate-y-1 sm:px-6 sm:py-4 sm:text-base"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full text-black">
                  <ShoppingBasket size={18} />
                </span>
                Shop our footwear
              </Link>

            </div>

            <div className="mt-9 flex items-center gap-3 lg:mt-8 xl:mt-12">

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

              <p className="text-xs text-black/50 sm:text-sm">
                Made for every kind of step.
              </p>

            </div>

          </div>

          {/* HERO VISUAL */}

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">

            <div className="absolute -right-2 top-6 z-10 rotate-6 rounded-2xl bg-[#171717] px-4 py-2.5 text-xs font-bold text-white shadow-xl sm:-right-4 sm:top-10 sm:px-5 sm:py-3 sm:text-sm">
              made by hand ♡
            </div>

            <div className="relative aspect-square w-full overflow-hidden rounded-[2.5rem] bg-[#FFF3E8] sm:rounded-[3rem]">

              <div className="absolute inset-0 flex items-center justify-center">

                <div className="rotate-[-12deg] drop-shadow-2xl transition duration-500 hover:rotate-[-5deg] hover:scale-105">

                  <Image
                    src={"/step.png"}
                    height={300}
                    width={300}
                    alt="image"
                    className="h-auto w-[220px] rounded-xl sm:w-[270px] lg:w-[230px] xl:w-[300px]"
                  />

                </div>

              </div>

              <div className="absolute bottom-5 left-5 rounded-2xl bg-white/80 px-4 py-3 backdrop-blur sm:bottom-7 sm:left-7 sm:px-5 sm:py-4">

                <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 sm:text-xs">
                  Today's mood
                </p>

                <p className="mt-1 text-sm font-black sm:text-base">
                  Soft & playful
                </p>

              </div>

            </div>

          </div>

        </div>

        <a
          href="#playground"
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 animate-bounce md:block"
        >
          <ArrowDown size={22} />
        </a>

      </section>


      {/* FEATURES */}

      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:py-24">

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
        className="scroll-mt-24 bg-[#171717] px-5 py-16 text-white sm:px-8 sm:py-20 lg:py-24"
      >

        <div className="mx-auto max-w-6xl">

          <div className="mb-10 max-w-2xl sm:mb-14">

            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#F4A261] sm:text-sm">
              The colour playground
            </p>

            <h2 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              What if it came
              <br />
              in <span className="text-pink-400">pink?</span>
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-7 text-white/50 sm:text-base">
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
        className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-20 lg:py-24"
      >

        <div className="mx-auto grid max-w-6xl items-center gap-10 sm:gap-14 lg:grid-cols-2 lg:gap-10 xl:gap-14">

          <div className="rounded-[2.5rem] bg-[#f5d9e5] p-7 sm:rounded-[3rem] sm:p-10 lg:p-12 xl:p-16">

            <div className="flex justify-center text-[120px] sm:text-[180px]">

              <div className="rotate-[-12deg] drop-shadow-2xl transition duration-500 hover:rotate-[-5deg] hover:scale-105">

                <Image
                  src={"/step.png"}
                  height={300}
                  width={300}
                  alt="image"
                  className="h-auto w-[220px] rounded-xl sm:w-[280px] lg:w-[240px] xl:w-[300px]"
                />

              </div>

            </div>

          </div>

          <div>

            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#C9683F] sm:text-sm">
              Our story
            </p>

            <h2 className="text-4xl font-black tracking-[-0.05em] sm:text-5xl lg:text-5xl xl:text-6xl">
              Made slowly.
              <br />
              Made beautifully.
            </h2>

            <p className="mt-6 text-sm leading-8 text-black/60 sm:mt-7 sm:text-base">
              Every Step is a Nigerian handmade footwear brand
              built around one simple idea: you shouldn't break the bank to own a{" "}
              <span className="text-[#F4A261]">step</span> of the piece.
            </p>

            <p className="mt-5 text-sm leading-8 text-black/60 sm:text-base">
              From the colours we choose to the details we finish
              by hand, every pair is made with intention.
            </p>

            <div className="mt-7 flex items-center gap-2 sm:mt-8">

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

              <span className="ml-2 text-xs font-semibold sm:text-sm">
                handmade with love
              </span>

            </div>

          </div>

        </div>

      </section>


      {/* SHOP CTA */}

      <section
        id="shop"
        className="px-5 pb-16 sm:px-8 sm:pb-20 lg:pb-24"
      >

        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-[#F4A261] px-6 py-12 text-center sm:rounded-[3rem] sm:px-12 sm:py-16 lg:py-20">

          <Heart
            className="mx-auto mb-5"
            size={28}
            fill="currentColor"
          />

          <h2 className="mx-auto max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Found a colour you love?
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm text-black/60 sm:text-base">
            Send us your favourite combination and let's make
            your pair.
          </p>

          <Link
            href="https://wa.me/+2348163186020"
            target="_blank"
            rel="noreferrer"
            className="mt-7 inline-flex rounded-full bg-[#171717] px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-1 sm:mt-8 sm:px-7 sm:py-4 sm:text-base"
          >
            Order on WhatsApp
          </Link>

        </div>

      </section>


      {/* FOOTER */}

      <footer className="border-t border-black/5 px-5 py-8 sm:px-8 sm:py-10">

        <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">

          <div>

            <p className="text-xl font-black tracking-[-0.05em]">
              every<span className="text-[#F4A261]">step</span>.
            </p>

            <p className="mt-1 text-sm text-black/40">
              © Handmade footwear from Nigeria.
            </p>

          </div>

          <a
            href=""
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <Send size={17} />
            @everyy.step_
          </a>

        </div>

      </footer>

    </main>
  );
}


function Feature({ number, title, text }) {
  return (
    <div className="rounded-[2rem] border border-black/5 bg-white p-7 transition duration-300 hover:-translate-y-2 hover:shadow-xl sm:p-8">

      <span className="text-sm font-black text-[#F4A261]">
        {number}
      </span>

      <h3 className="mt-10 text-xl font-black sm:mt-12 sm:text-2xl">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-black/50 sm:text-base">
        {text}
      </p>

    </div>
  );
}