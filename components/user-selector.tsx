"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserType {
  _id: string
  name: string
  email: string
  mobile?: string | null // Allow mobile to be optional or null
}

interface UserSelectorProps {
  users: UserType[]
  selectedUserId: string
  onUserSelect: (userId: string) => void
  placeholder?: string
  disabled?: boolean
}

export function UserSelector({
  users,
  selectedUserId,
  onUserSelect,
  placeholder = "Search or select a user...",
  disabled = false,
}: UserSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  const selectedUser = users.find((user) => user._id === selectedUserId)

  // Filter users based on search input
  const filteredUsers = users.filter((user) => {
    if (!searchValue) return true

    const searchLower = searchValue.toLowerCase()
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.mobile?.includes(searchValue) ?? false)
    )
  })

  const handleSelect = (userId: string) => {
    onUserSelect(userId)
    setOpen(false)
    setSearchValue("")
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setSearchValue("")
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <div className="flex items-center">
            <Check className="mr-2 h-4 w-4 text-muted-foreground" />
            {selectedUser ? (
              <span className="truncate">
                {selectedUser.name} - {selectedUser.mobile}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Type to search users..." value={searchValue} onValueChange={setSearchValue} />
          <CommandList>
            {filteredUsers.length === 0 ? (
              <CommandEmpty>
                {searchValue ? "No users found matching your search." : "No users available."}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredUsers.map((user) => (
                  <CommandItem
                    key={user._id}
                    value={user._id}
                    onSelect={() => handleSelect(user._id)}
                    className="flex items-start gap-3 p-3 cursor-pointer hover:bg-accent"
                  >
                    <Check className={cn("mt-1 h-4 w-4", selectedUserId === user._id ? "opacity-100" : "opacity-0")} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{user.name}</div>
                      <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                      <div className="text-sm text-muted-foreground">{user.mobile}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}