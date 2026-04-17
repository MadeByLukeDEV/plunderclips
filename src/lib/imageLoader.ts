type LoaderProps = {
  src: string
  width: number
  quality?: number
}

export default function imageLoader({ src, width, quality }: LoaderProps) {
  const q = quality || 75

  return `https://transformation.tenkaistudio.com/${src}?w=${width}&q=${q}&format=webp`
}