"use client";







import { useEffect, useState } from "react";



import Link from "next/link";



import { useSearchParams } from "next/navigation";



import { createClient } from "@/lib/supabase/client";



import { ArrowRight, Check, ChevronLeft, Eye, EyeOff, Gift, LockKeyhole, Mail, ShieldCheck, Sparkles, LogOut } from "lucide-react";

function GoogleMark() {

  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5"><path fill="#4285F4" d="M21.35 12.22c0-.71-.06-1.39-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.22Z"/><path fill="#34A853" d="M12 21.75c2.62 0 4.82-.87 6.43-2.31l-3.14-2.45c-.87.59-1.98.94-3.29.94-2.53 0-4.68-1.71-5.45-4.01H3.32v2.53A9.75 9.75 0 0 0 12 21.75Z"/><path fill="#FBBC05" d="M6.55 13.92a5.85 5.85 0 0 1 0-3.84V7.55H3.32a9.75 9.75 0 0 0 0 8.9l3.23-2.53Z"/><path fill="#EA4335" d="M12 6.07c1.42 0 2.69.49 3.69 1.44l2.76-2.76A9.3 9.3 0 0 0 12 2.25a9.75 9.75 0 0 0-8.68 5.3l3.23 2.53c.77-2.3 2.92-4.01 5.45-4.01Z"/></svg>;

}

export default function AccountContent() {



  const search = useSearchParams();



  const nextValue = search.get("next") || "/profile";



  const next = nextValue.startsWith("/") && !nextValue.startsWith("//") && !nextValue.includes("\\") ? nextValue : "/profile";



  const [mode, setMode] = useState("signup");



  const [email, setEmail] = useState("");



  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");



  const [showPassword, setShowPassword] = useState(false);



  const [busy, setBusy] = useState(false);



  const [notice, setNotice] = useState("");



  const [error, setError] = useState("");



  const [signedIn, setSignedIn] = useState(false);

  const [checking, setChecking] = useState(true);







  useEffect(() => {



    const supabase = createClient();



    supabase.auth.getUser().then(({ data }) => { setSignedIn(Boolean(data?.user)); setChecking(false); }).catch(() => setChecking(false));



    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session?.user)));



    return () => subscription.unsubscribe();



  }, []);







  async function logout() {

    setBusy(true); setError("");

    const { error: logoutError } = await createClient().auth.signOut();

    setBusy(false);

    if (logoutError) setError(logoutError.message);

    else { setSignedIn(false); setMode("signin"); window.location.assign("/account"); }

  }



  async function social(provider) {



    setBusy(true); setError(""); setNotice("");



    try {



      const supabase = createClient();



      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;



      const { error: authError } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo, queryParams: { prompt: "select_account" } } });



      if (authError) throw authError;



    } catch (err) { setError(err.message || "Couldn't connect to the sign-in provider."); setBusy(false); }



  }







  async function submit(event) {



    event.preventDefault(); setBusy(true); setError(""); setNotice("");



    try {



      const supabase = createClient();



      if (mode === "forgot") {



        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/account")}` });



        if (authError) throw authError;



        setNotice("Check your inbox for a password-reset link. You'll need a password-update screen to complete the reset.");



      } else if (mode === "signup") {



        const cleanUsername = username.trim().replace(/^@/, "");
        if (!/^[a-zA-Z0-9_]{3,24}$/.test(cleanUsername)) throw new Error("Username must be 3–24 letters, numbers or underscores.");
        const { data, error: authError } = await supabase.auth.signUp({ email, password, options: { data: { username: cleanUsername }, emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });



        if (authError) throw authError;



        if (data.session) window.location.assign(next);



        else setNotice("You're nearly there! Check your email for a confirmation link, then sign in to continue.");



      } else {



        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });



        if (authError) throw authError;



        window.location.assign(next);



      }



    } catch (err) { setError(err.message || "Something went wrong. Please try again."); }



    finally { setBusy(false); }



  }







  const title = mode === "signup" ? "Your next step starts here." : mode === "signin" ? "Welcome back." : "Reset your password.";



  return (



    <main className="min-h-screen bg-[#FFF9F3] px-4 py-8 text-[#2A211C] sm:px-6 sm:py-12">



      <div className="mx-auto max-w-6xl">



        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#775A49] hover:text-[#2A211C]"><ChevronLeft size={17}/> Back to home</Link>



        <div className="grid overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_80px_rgba(68,38,15,0.10)] lg:grid-cols-[.95fr_1.05fr]">



          <aside className="relative hidden min-h-[650px] overflow-hidden bg-[#2A211C] p-12 text-white lg:flex lg:flex-col lg:justify-between">



            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#F4A261]/25 blur-2xl" />



            <div className="pointer-events-none absolute -bottom-28 -left-24 h-96 w-96 rounded-full border-[65px] border-[#F4A261]/15" />



            <div className="relative z-10"><div className="mb-16 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-bold tracking-wide"><Sparkles size={16} className="text-[#F4A261]"/> EVERY STEP</div><p className="mb-5 text-xs font-black uppercase tracking-[.3em] text-[#F4A261]">A little more with every order</p><h2 className="max-w-sm text-5xl font-black leading-[1.12]">Good shoes.<br/><span className="text-[#F4A261]">Great rewards.</span></h2><p className="mt-7 max-w-sm text-base leading-8 text-white/65">A beautiful pair is just the beginning. Join the Every Step family and make your purchases more rewarding.</p></div>



            <div className="relative z-10 space-y-4"><div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"><Gift className="shrink-0 text-[#F4A261]"/><div><p className="font-bold">Earn Step Coins</p><p className="text-sm text-white/55">Earn 15 Step Coins for each eligible fulfilled order.</p></div></div><div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"><ShieldCheck className="shrink-0 text-[#F4A261]"/><div><p className="font-bold">Your account, your way</p><p className="text-sm text-white/55">Google or your email.</p></div></div></div>



          </aside>



          <section className="px-6 py-9 sm:px-12 sm:py-14 lg:px-16">



            <div className="mb-7 flex items-center justify-between"><span className="rounded-full bg-[#FFF1E3] px-4 py-2 text-xs font-black uppercase tracking-widest text-[#A45E31]">Every Step Club</span><Link href="/" className="text-xs font-bold text-[#8C6C57] hover:underline">Continue as guest <ArrowRight className="inline" size={14}/></Link></div>



            {checking ? <p className="py-12 text-center">Checking your session…</p> : signedIn ? <div className="rounded-3xl bg-[#FFF9F3] p-8 text-center"><Check className="mx-auto mb-4 text-green-700" size={32}/><h1 className="text-2xl font-black">You're signed in!</h1><p className="mt-2 text-sm text-[#775A49]">Manage your Every Step profile and rewards.</p><Link href="/profile" className="mt-6 inline-block rounded-full bg-[#F4A261] px-7 py-4 font-bold">View my profile <ArrowRight className="ml-1 inline" size={16}/></Link><button type="button" onClick={logout} disabled={busy} className="mt-4 flex mx-auto items-center gap-2 text-sm font-bold text-[#A65D2D]"><LogOut size={16}/> Log out</button>{error && <p role="alert" className="mt-3 text-red-700">{error}</p>}</div> : <>



              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1><p className="mt-3 text-sm leading-7 text-[#806A5C]">{mode === "signup" ? "Create an account to collect rewards as you shop. It only takes a moment." : mode === "signin" ? "Your next favourite pair is waiting. Sign in to continue." : "Enter your email and we'll send you a reset link."}</p>



              {mode !== "forgot" && <><div className="mt-8 grid gap-3"><button type="button" onClick={() => social("google")} disabled={busy} className="flex items-center justify-center gap-3 rounded-2xl border border-[#E9E0D8] px-4 py-4 text-sm font-bold transition hover:border-[#F4A261] hover:bg-[#FFF9F3] disabled:opacity-50"><GoogleMark/> Google</button></div><div className="my-7 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-[#A6978D]"><div className="h-px flex-1 bg-[#E9E0D8]"/>or use your email<div className="h-px flex-1 bg-[#E9E0D8]"/></div></>}



              <form onSubmit={submit} className={mode === "forgot" ? "mt-8 space-y-5" : "space-y-5"}>
                  {mode === "signup" && <label className="block"><span className="mb-2 block text-sm font-bold">Username</span><input required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]{3,24}" value={username} onChange={e=>setUsername(e.target.value)} placeholder="e.g. queen_steps" autoComplete="username" className="w-full rounded-2xl border border-[#E9E0D8] bg-[#FFFCFA] px-4 py-4 text-sm outline-none focus:border-[#F4A261]"/><span className="mt-1 block text-xs text-[#806A5C]">3–24 letters, numbers or underscores.</span></label>}



                <label className="block"><span className="mb-2 block text-sm font-bold">Email address</span><span className="flex items-center gap-3 rounded-2xl border border-[#E9E0D8] bg-[#FFFCFA] px-4 focus-within:border-[#F4A261] focus-within:ring-2 focus-within:ring-[#F4A261]/20"><Mail size={18} className="shrink-0 text-[#A6978D]"/><input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-transparent py-4 text-sm outline-none"/></span></label>



                {mode !== "forgot" && <label className="block"><span className="mb-2 block text-sm font-bold">Password</span><span className="flex items-center gap-3 rounded-2xl border border-[#E9E0D8] bg-[#FFFCFA] px-4 focus-within:border-[#F4A261] focus-within:ring-2 focus-within:ring-[#F4A261]/20"><LockKeyhole size={18} className="shrink-0 text-[#A6978D]"/><input required minLength={6} type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters" className="w-full bg-transparent py-4 text-sm outline-none"/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword ? "Hide password" : "Show password"} className="text-[#806A5C]">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span></label>}



                {mode === "signin" && <button type="button" onClick={()=>{setMode("forgot");setError("");setNotice("");}} className="block text-sm font-bold text-[#B16B3C] hover:underline">Forgot password?</button>}



                {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="rounded-xl bg-[#FFF1E3] p-3 text-sm text-[#86502E]">{notice}</p>}



                <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#F4A261] px-5 py-4 font-black text-[#2A211C] transition hover:bg-[#E99551] disabled:opacity-50">{busy ? "Please wait…" : mode === "signup" ? "Create my account" : mode === "signin" ? "Sign in" : "Send reset link"}<ArrowRight size={18}/></button>



              </form>



              <p className="mt-7 text-center text-sm text-[#806A5C]">{mode === "signup" ? "Already part of the family? " : mode === "signin" ? "New to Every Step? " : "Remembered your password? "}<button type="button" onClick={()=>{setMode(mode === "signup" ? "signin" : mode === "signin" ? "signup" : "signin");setError("");setNotice("");}} className="font-black text-[#A65D2D] hover:underline">{mode === "signup" ? "Sign in" : mode === "signin" ? "Create an account" : "Sign in"}</button></p>



              <div className="mt-8 flex items-start gap-3 rounded-2xl bg-[#FFF9F3] p-4 text-xs leading-6 text-[#806A5C]"><ShieldCheck className="mt-0.5 shrink-0 text-[#B16B3C]" size={19}/><p>Creating an account is optional. You can always place your order through WhatsApp as a guest. Step Coins are awarded after eligible orders are verified and fulfilled.</p></div>



            </>}



          </section>



        </div>



      </div>



    </main>



  );



}