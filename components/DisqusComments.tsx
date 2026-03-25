'use client'

import { useEffect, useRef } from 'react'

interface DisqusCommentsProps {
  url: string
  identifier: string
}

export default function DisqusComments({ url, identifier }: DisqusCommentsProps) {
  const disqusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Set Disqus configuration
    ;(window as any).disqus_config = function (this: any) {
      this.page.url = url
      this.page.identifier = identifier
    }

    // If Disqus is already loaded (e.g. navigating between posts), reset it
    if ((window as any).DISQUS) {
      ;(window as any).DISQUS.reset({
        reload: true,
        config: function (this: any) {
          this.page.url = url
          this.page.identifier = identifier
        },
      })
      return
    }

    // Load the Disqus embed script
    const script = document.createElement('script')
    script.src = 'https://colorwaysports.disqus.com/embed.js'
    script.setAttribute('data-timestamp', String(+new Date()))
    script.async = true
    document.body.appendChild(script)

    return () => {
      // Cleanup on unmount
      const disqusThread = document.getElementById('disqus_thread')
      if (disqusThread) {
        disqusThread.innerHTML = ''
      }
    }
  }, [url, identifier])

  return (
    <section className="mt-12 pt-8 border-t border-border">
      <h2 className="text-xl font-bold text-black mb-6 tracking-tight">
        Comments
      </h2>
      <div id="disqus_thread" ref={disqusRef} />
      <noscript>
        <p className="text-gray-medium text-sm">
          Please enable JavaScript to view comments powered by Disqus.
        </p>
      </noscript>
    </section>
  )
}
