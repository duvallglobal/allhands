"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import Image from "next/image"

interface ImageUploadProps {
  onImageUpload: (file: File) => void
  isProcessing?: boolean
}

export function ImageUpload({ onImageUpload, isProcessing = false }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setUploadedFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    disabled: isProcessing
  })

  const handleProcess = () => {
    if (uploadedFile) {
      onImageUpload(uploadedFile)
    }
  }

  const clearImage = () => {
    setPreview(null)
    setUploadedFile(null)
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {!preview ? (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-muted">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium">
                  {isDragActive ? 'Drop the image here' : 'Upload product image'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Drag & drop or click to select (JPEG, PNG, WebP)
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <div className="relative aspect-square max-w-md mx-auto rounded-lg overflow-hidden bg-muted">
                <Image
                  src={preview}
                  alt="Product preview"
                  fill
                  className="object-cover"
                />
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={clearImage}
                disabled={isProcessing}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={clearImage}
                disabled={isProcessing}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Choose Different Image
              </Button>
              <Button
                onClick={handleProcess}
                disabled={isProcessing}
                className="bg-primary hover:bg-primary/90"
              >
                {isProcessing ? 'Processing...' : 'Process Image'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}