"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [identityNumber, setIdentityNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [phase, setPhase] = useState<'request'|'verify'|'reset'>('request')
  const [code, setCode] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const requestCode = async () => {
    setError(''); setMessage(''); setLoading(true)
    if(identityNumber.length!==11 || phone.length!==11){ setError('Kimlik ve telefon 11 haneli olmalı'); setLoading(false); return }
    // Simüle: Ücretsiz gerçek SMS servisi olmadığından backend sahte kod üretir (ör: 000000)
    const res = await fetch('/api/auth/forgot', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ identityNumber, phone }) })
    const data = await res.json()
    if(!res.ok){ setError(data.error||'İşlem başarısız'); } else { setMessage('Doğrulama kodu gönderildi (demo: 000000)'); setPhase('verify') }
    setLoading(false)
  }
  const verifyCode = async () => {
    setError(''); setMessage(''); setLoading(true)
    const res = await fetch('/api/auth/forgot/verify', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ identityNumber, code }) })
    const data = await res.json(); if(!res.ok){ setError(data.error||'Kod hatalı'); } else { setPhase('reset'); setMessage('Kod doğrulandı, yeni şifre belirleyin'); }
    setLoading(false)
  }
  const resetPass = async () => {
    setError(''); setMessage(''); setLoading(true)
    if(newPass.length<6 || newPass!==confirm){ setError('Şifre koşulları sağlanmıyor'); setLoading(false); return }
    const res = await fetch('/api/auth/forgot/reset', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ identityNumber, code, password:newPass }) })
    const data = await res.json(); if(!res.ok){ setError(data.error||'Şifre güncellenemedi'); } else { setMessage('Şifre güncellendi. Giriş yapabilirsiniz.'); setPhase('request') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <Card className="w-full max-w-md border-gray-700 bg-gray-800/70">
        <CardHeader>
          <CardTitle className="text-white">Şifre Sıfırlama</CardTitle>
          <CardDescription className="text-gray-400">SMS kodu ile şifre yenile (demo)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && <Alert className="bg-green-900/30 border-green-700"><AlertDescription className="text-green-200">{message}</AlertDescription></Alert>}
          {error && <Alert className="bg-red-900/40 border-red-700"><AlertDescription className="text-red-200">{error}</AlertDescription></Alert>}
          {phase==='request' && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Kimlik Numarası</Label>
                <Input value={identityNumber} maxLength={11} onChange={e=> setIdentityNumber(e.target.value.replace(/\D/g,'').slice(0,11))} className="bg-gray-900 border-gray-600 text-white" />
              </div>
              <div>
                <Label className="text-gray-300">Telefon</Label>
                <Input value={phone} maxLength={11} onChange={e=> setPhone(e.target.value.replace(/\D/g,'').slice(0,11))} className="bg-gray-900 border-gray-600 text-white" />
              </div>
              <Button disabled={loading} onClick={requestCode} className="w-full bg-orange-600 hover:bg-orange-700">Kod Gönder</Button>
            </div>
          )}
          {phase==='verify' && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Gönderilen Kod</Label>
                <Input value={code} maxLength={6} onChange={e=> setCode(e.target.value.replace(/\D/g,'').slice(0,6))} className="bg-gray-900 border-gray-600 text-white tracking-widest text-center" />
              </div>
              <Button disabled={loading} onClick={verifyCode} className="w-full bg-blue-600 hover:bg-blue-700">Doğrula</Button>
            </div>
          )}
          {phase==='reset' && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Yeni Şifre</Label>
                <Input type="password" value={newPass} onChange={e=> setNewPass(e.target.value)} className="bg-gray-900 border-gray-600 text-white" />
              </div>
              <div>
                <Label className="text-gray-300">Yeni Şifre Tekrar</Label>
                <Input type="password" value={confirm} onChange={e=> setConfirm(e.target.value)} className="bg-gray-900 border-gray-600 text-white" />
              </div>
              <Button disabled={loading} onClick={resetPass} className="w-full bg-green-600 hover:bg-green-700">Şifreyi Güncelle</Button>
            </div>
          )}
          <div className="text-center text-xs text-gray-500 pt-2">
            <Link href="/auth/login" className="hover:text-orange-400">Girişe dön</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
