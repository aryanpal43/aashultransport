"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, ChevronDown, User, Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserType {
  _id: string
  name: string
  email: string
  mobile: string
}

interface UserDropdownProps {
  users: UserType[]
  selectedUserId: string
  onUserSelect: (userId: string) => void
  placeholder?: string
  disabled?: boolean
}

export function UserDropdown({
  users,
  selectedUserId,
  onUserSelect,
  placeholder = "Search or select a user...",
  disabled = false,
}: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isMounted, setIsMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Ensure component is mounted before rendering interactive elements
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const selectedUser = users.find((user) => user._id === selectedUserId)

  // Filter users based on search input
  const filteredUsers = users.filter((user) => {
    if (!searchValue.trim()) return true;

    const searchLower = searchValue.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.mobile?.includes(searchValue) ?? false)
    )
  })

  // Handle clicking outside to close dropdown
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false)
      setSearchValue("")
      setHighlightedIndex(-1)
    }
  }, [])

  useEffect(() => {
    if (!isMounted) return

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMounted, handleClickOutside])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault()
          setHighlightedIndex((prev) => (prev < filteredUsers.length - 1 ? prev + 1 : 0))
          break
        case "ArrowUp":
          event.preventDefault()
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredUsers.length - 1))
          break
        case "Enter":
          event.preventDefault()
          if (highlightedIndex >= 0 && filteredUsers[highlightedIndex]) {
            handleUserSelect(filteredUsers[highlightedIndex]._id)
          }
          break
        case "Escape":
          setIsOpen(false)
          setSearchValue("")
          setHighlightedIndex(-1)
          break
      }
    },
    [isOpen, highlightedIndex, filteredUsers],
  )

  useEffect(() => {
    if (!isMounted) return

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isMounted, handleKeyDown])

  const handleUserSelect = (userId: string) => {
    onUserSelect(userId)
    setIsOpen(false)
    setSearchValue("")
    setHighlightedIndex(-1)
  }

  const handleToggleDropdown = () => {
    if (disabled) return

    setIsOpen(!isOpen)
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setSearchValue("")
      setHighlightedIndex(-1)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
    setHighlightedIndex(-1)
  }

  // Don't render interactive elements until mounted
  if (!isMounted) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between text-left font-normal text-muted-foreground"
        disabled
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <User className="h-4 w-4 shrink-0" />
          <span className="truncate">{placeholder}</span>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </Button>
    )
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-between text-left font-normal",
          !selectedUser && "text-muted-foreground",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        onClick={handleToggleDropdown}
        disabled={disabled}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <User className="h-4 w-4 shrink-0" />
          {selectedUser ? (
            <span className="truncate">
              {selectedUser.name} - {selectedUser.mobile}
            </span>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
          {/* Search Input */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Type to search users..."
                value={searchValue}
                onChange={handleSearchChange}
                className="pl-8 h-8"
              />
            </div>
          </div>

          {/* User List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchValue ? "No users found matching your search." : "No users available."}
              </div>
            ) : (
              <div className="p-1">
                {filteredUsers.map((user, index) => (
                  <div
                    key={user._id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-sm cursor-pointer transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      highlightedIndex === index && "bg-accent text-accent-foreground",
                      selectedUserId === user._id && "bg-primary/10",
                    )}
                    onClick={() => handleUserSelect(user._id)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 mt-0.5 shrink-0",
                        selectedUserId === user._id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{user.name}</div>
                      <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                      <div className="text-sm text-muted-foreground">{user.mobile}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
