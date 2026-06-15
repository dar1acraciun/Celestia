import { useState, useRef } from 'react'
import { predictGNN, predictAstrometry, addHistory, uploadImage } from '../api'
import { useAuth } from '../../../context/AuthContext'

export function useIdentify() {
  const { isLoggedIn } = useAuth()
  const [gnnResult, setGnnResult] = useState(null)
  const [gnnLoading, setGnnLoading] = useState(false)
  const [astroResult, setAstroResult] = useState(null)
  const [astroLoading, setAstroLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const generationRef = useRef(0)

  const handleNewPrediction = () => {
    generationRef.current += 1
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setGnnResult(null)
    setAstroResult(null)
    setGnnLoading(false)
    setAstroLoading(false)
  }

  const handleImageUpload = async (file) => {
    generationRef.current += 1
    const gen = generationRef.current

    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(URL.createObjectURL(file))
    setGnnResult(null)
    setAstroResult(null)
    setGnnLoading(true)
    setAstroLoading(true)

    const gnnPromise = predictGNN(file)
      .then((data) => { if (generationRef.current === gen) setGnnResult({ data }); return data })
      .catch((err) => { if (generationRef.current === gen) setGnnResult({ error: err.message }); return null })
      .finally(() => { if (generationRef.current === gen) setGnnLoading(false) })

    const astroPromise = predictAstrometry(file)
      .then((data) => { if (generationRef.current === gen) setAstroResult({ data }); return data })
      .catch((err) => { if (generationRef.current === gen) setAstroResult({ error: err.message }); return null })
      .finally(() => { if (generationRef.current === gen) setAstroLoading(false) })

    Promise.all([gnnPromise, astroPromise]).then(([gnnData, astroData]) => {
      if (generationRef.current === gen && gnnData && isLoggedIn) {
        uploadImage(file)
          .then(({ url }) => addHistory(gnnData, astroData, url))
          .catch(() => addHistory(gnnData, astroData, file.name))
      }
    })
  }

  return {
    gnnResult,
    gnnLoading,
    astroResult,
    astroLoading,
    imagePreview,
    handleImageUpload,
    handleNewPrediction,
  }
}
