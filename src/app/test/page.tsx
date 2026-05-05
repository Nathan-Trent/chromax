"use client";

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export default function TestPage() {
  return (
    <div className="p-12 space-y-8 max-w-2xl">

      <h1 className="text-2xl font-semibold">Design system test</h1>

      {/* Buttons */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">Buttons</h2>
        <div className="flex gap-3 flex-wrap">
          <Button variant="primary">Primary button</Button>
          <Button variant="outline">Outline button</Button>
          <Button variant="ghost">Ghost button</Button>
          <Button variant="primary" loading>Loading</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
        <div className="flex gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </div>

      {/* Badges */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">Badges</h2>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="amber">Amber</Badge>
          <Badge variant="blue">Blue</Badge>
          <Badge variant="teal">Teal</Badge>
          <Badge variant="purple">Purple</Badge>
          <Badge variant="coral">Coral</Badge>
          <Badge variant="green">Green</Badge>
          <Badge variant="navy">Navy</Badge>
          <Badge variant="default">Default</Badge>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">Cards</h2>
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <p className="text-sm">Default card</p>
          </Card>
          <Card accent="amber">
            <p className="text-sm">Amber accent</p>
          </Card>
          <Card accent="blue">
            <p className="text-sm">Blue accent</p>
          </Card>
          <Card accent="teal" onClick={() => alert('clicked')}>
            <p className="text-sm">Teal accent — clickable</p>
          </Card>
        </div>
      </div>

    </div>
  )
}