"use client"

import * as React from "react"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

function DateRangePicker({
  className,
  startDate,
  endDate,
  onDateChange,
  placeholder = "Pick a date range",
  ...props
}) {
  const [date, setDate] = React.useState({
    from: startDate,
    to: endDate,
  })

  React.useEffect(() => {
    setDate({ from: startDate, to: endDate })
  }, [startDate, endDate])

  const handleSelect = (selectedRange) => {
    setDate(selectedRange)
    if (onDateChange && selectedRange) {
      onDateChange({
        startDate: selectedRange.from,
        endDate: selectedRange.to
      })
    }
  }

  const handleClear = () => {
    setDate({ from: undefined, to: undefined })
    if (onDateChange) {
      onDateChange({
        startDate: null,
        endDate: null
      })
    }
  }

  const formatDateRange = () => {
    if (date?.from) {
      if (date.to) {
        return `${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}`
      } else {
        return format(date.from, "LLL dd, y")
      }
    }
    return placeholder
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date?.from && "text-muted-foreground"
            )}
            {...props}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
            {date?.from && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-auto p-0 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleClear()
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

function SingleDatePicker({
  className,
  date,
  onDateChange,
  placeholder = "Pick a date",
  ...props
}) {
  const [selectedDate, setSelectedDate] = React.useState(date)

  React.useEffect(() => {
    setSelectedDate(date)
  }, [date])

  const handleSelect = (newDate) => {
    setSelectedDate(newDate)
    if (onDateChange) {
      onDateChange(newDate)
    }
  }

  const handleClear = () => {
    setSelectedDate(undefined)
    if (onDateChange) {
      onDateChange(null)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
          {...props}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, "PPP") : <span>{placeholder}</span>}
          {selectedDate && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-auto p-0 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleClear()
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export { DateRangePicker, SingleDatePicker }
