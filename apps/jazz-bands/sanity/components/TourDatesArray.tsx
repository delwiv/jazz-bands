import React from 'react'
import { Card } from '@sanity/ui'
import type { ArrayOfObjectsInputProps, ArraySchemaType } from 'sanity'

interface TourDate {
  _key?: string
  date?: string
  city?: string
  venue?: string
  region?: string
  details?: string
  ticketsUrl?: string
  soldOut?: boolean
  slug?: string
  _type?: 'tourDate'
}

export type TourDatesArrayProps = ArrayOfObjectsInputProps<
  TourDate,
  ArraySchemaType
>

export function TourDatesArray(props: TourDatesArrayProps) {
  const { members, value = [], onChange } = props

  // Sort members by date descending for display (most recent first)
  const sortedMembers = React.useMemo(() => {
    if (!members) return members
    return [...members].sort((a, b) => {
      const dateA = a.item?.value?.date ? new Date(a.item.value.date).getTime() : 0
      const dateB = b.item?.value?.date ? new Date(b.item.value.date).getTime() : 0
      return dateB - dateA // Newest first
    })
  }, [members])

  // Custom onChange handler that also sorts on save
  const handleChange = React.useCallback(
    (newValue: TourDate[] | ((prev: TourDate[]) => TourDate[])) => {
      const resolved =
        typeof newValue === 'function' ? newValue(value) : newValue
      const sorted = [...resolved].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0
        const dateB = b.date ? new Date(b.date).getTime() : 0
        return dateB - dateA // Newest first
      })
      onChange(sorted)
    },
    [onChange, value]
  )

  return (
    <Card padding={3} radius={2}>
      <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
        {/* Use renderDefault with sorted members and custom onChange */}
        {props.renderDefault({ ...props, members: sortedMembers, onChange: handleChange })}
      </div>
    </Card>
  )
}
