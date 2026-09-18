import { createContext, useContext, useCallback, useRef, useState } from 'react'
import { useUnifiedStorage } from '../hooks/useUnifiedStorage'
import type { Generation } from '../types/models'

interface GenerationRequest {
  id: string
  modelId: string
  modelName: string
  inputData: Record<string, any>
  outputType: string
  formData: Record<string, any>
  startTime: number
  extractFn?: (response: any) => any
}

interface ActiveJob {
  id: string
  modelId: string
  modelName: string
  startTime: number
}

interface GenerationQueueContextType {
  queueGeneration: (request: GenerationRequest, promise: Promise<any>) => void
  activeJobs: ActiveJob[]
}

const GenerationQueueContext = createContext<GenerationQueueContextType | null>(null)

export function GenerationQueueProvider({ children }: { children: React.ReactNode }) {
  const [, setGenerations] = useUnifiedStorage('generations', [], { skipLocalStorage: true })
  const activeRequests = useRef<Map<string, { request: GenerationRequest; promise: Promise<any> }>>(new Map())
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([])

  const updateActiveJobs = useCallback(() => {
    const jobs: ActiveJob[] = Array.from(activeRequests.current.values()).map(({ request }) => ({
      id: request.id,
      modelId: request.modelId,
      modelName: request.modelName,
      startTime: request.startTime,
    }))
    setActiveJobs(jobs)
  }, [])

  const queueGeneration = useCallback((request: GenerationRequest, promise: Promise<any>) => {
    // Store the request and promise
    activeRequests.current.set(request.id, { request, promise })
    updateActiveJobs()

    // Handle the promise completion
    promise
      .then((response) => {

        // Extract output using schema if provided
        const extractedOutput = request.extractFn
          ? request.extractFn(response)
          : response.output

        // Save to storage - split multiple outputs into separate entries
        const baseTimestamp = Date.now()
        const newGenerations: Generation[] = []

        // Use actual response ID from API
        const actualId = response.id || request.id

        // Check if output is an array (multiple outputs)
        if (Array.isArray(extractedOutput)) {
          // Create a separate generation entry for each output
          extractedOutput.forEach((singleOutput, index) => {
            const generation: Generation = {
              id: `${actualId}_${index}`,
              timestamp: baseTimestamp + index,
              modelId: request.modelId,
              modelName: request.modelName,
              inputData: request.inputData,
              formData: request.formData, // Save original form data for remixing
              outputData: {
                type: request.outputType as any,
                content: singleOutput,
              },
              metadata: {
                duration: Date.now() - request.startTime,
                status: 'succeeded',
              },
            }
            newGenerations.push(generation)
          })
        } else {
          // Single output - create one entry
          const generation: Generation = {
            id: actualId,
            timestamp: baseTimestamp,
            modelId: request.modelId,
            modelName: request.modelName,
            inputData: request.inputData,
            formData: request.formData, // Save original form data for remixing
            outputData: {
              type: request.outputType as any,
              content: extractedOutput,
            },
            metadata: {
              duration: Date.now() - request.startTime,
              status: 'succeeded',
            },
          }
          newGenerations.push(generation)
        }

        // Save to storage (persists even if original component unmounted)
        setGenerations((prevGenerations) => [...newGenerations, ...prevGenerations])

        // Clean up
        activeRequests.current.delete(request.id)
        updateActiveJobs()
      })
      .catch((err) => {
        console.error('❌ [GenerationQueue] Generation failed:', err)
        activeRequests.current.delete(request.id)
        updateActiveJobs()
      })
  }, [updateActiveJobs, setGenerations])

  return (
    <GenerationQueueContext.Provider value={{ queueGeneration, activeJobs }}>
      {children}
    </GenerationQueueContext.Provider>
  )
}

export function useGenerationQueue() {
  const context = useContext(GenerationQueueContext)
  if (!context) {
    throw new Error('useGenerationQueue must be used within GenerationQueueProvider')
  }
  return context
}
