"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { CustomButton1 } from "@/components/ui/CustomButton1"
import { CustomButton2 } from "@/components/ui/CustomButton2"
import { CustomInput } from "@/components/ui/CustomInput"
import { Reveal } from "@/components/ui/Reveal"

export default function SignUpPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)

    setTimeout(() => {
      setIsLoading(false)
      console.log("Mock sign up with", email, password)
      router.push("/onboard")
    }, 1500)
  }

  return (
    <div className="min-h-screen w-full bg-background relative text-foreground">
      {/* Back Button */}
      <CustomButton2
        onClick={() => router.back()}
        className="fixed top-4 left-4 lg:top-8 lg:left-8 z-20"
      >
        <ArrowLeft size={20} />
        Back
      </CustomButton2>

      {/* Main Container */}
      <div className="h-screen flex items-center justify-center p-8">
        <Reveal className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <h1 className="block text-2xl font-normal text-foreground">Sign Up</h1>
            <span className="block text-base font-normal text-muted-foreground">Create your account</span>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-base text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignUp}>
            <div className="space-y-4">
              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="block text-base font-normal text-muted-foreground px-1">
                  Email
                </label>
                <CustomInput
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <label className="block text-base font-normal text-muted-foreground px-1">
                  Password
                </label>
                <div className="relative">
                  <CustomInput
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-12"
                  />
                  <div
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-2">
                <label className="block text-base font-normal text-muted-foreground px-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <CustomInput
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className="pr-12"
                  />
                  <div
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <CustomButton1
                type="submit"
                disabled={isLoading}
                className="w-full mt-2"
              >
                {isLoading ? "Creating account..." : "Sign Up"}
              </CustomButton1>
            </div>
          </form>

          {/* Sign In Link */}
          <div className="mt-8 text-center">
            <p className="block text-base font-normal text-muted-foreground">
              Already have an account?{" "}
              <Link href="/signin" className="text-emerald-600 hover:text-emerald-700">
                Log In
              </Link>
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
