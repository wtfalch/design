/**
 * The catalogue: one entry per component, each with all of its variants.
 *
 * **One component to a page.** This was a single long scroll, and that is the
 * wrong shape for the job: you cannot judge whether four button states are
 * distinguishable while three of them are off screen, and a page showing
 * everything shows nothing in particular. The rail picks one thing and the pane
 * shows that thing, every way it can look.
 *
 * **A variant is not a component.** `banner` and `callout` were listed as two
 * entries, which said they were two things -- while the whole point of the work
 * was that they are one box with a tone. A catalogue that disagrees with the
 * design is worse than no catalogue, because it is the document people trust.
 *
 * **It renders the real thing.** Same `styles.css`, same `tokens.css`, same
 * components. A gallery with its own copy of a button is a gallery that lies the
 * first time the real one changes.
 */

import { useState } from 'react'

import {
  Brand,
  Button,
  Callout,
  Card,
  Checkbox,
  Row as DataRow,
  Dialog,
  Empty,
  Field,
  ICON_NAMES,
  ILLUSTRATIONS,
  Icon,
  Illustration,
  Input,
  Markdown,
  Modal,
  Pill,
  Progress,
  Rows,
  Select,
  SizeGrid,
  Skeleton,
  Slider,
  Table,
  Tabs,
  Textarea,
  ToastHost,
  Toggle,
  Tooltip,
  useToast,
} from '@wtfalch/design'

export interface Variant {
  name: string
  /** What to look at, or why it exists. One sentence, or nothing. */
  note?: string
  render: () => React.ReactNode
}

export interface Component {
  id: string
  name: string
  blurb?: string
  variants: Variant[]
}

/** A row of things to compare, which is most of what a variant is. */
function Row({ children }: { children: React.ReactNode }) {
  return <div className="spec-row">{children}</div>
}

function SelectDemo({ block = false }: { block?: boolean }) {
  const [value, setValue] = useState('qwen3:4b')
  return (
    <Select
      aria-label="Model"
      block={block}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    >
      <option value="qwen3:4b">qwen3:4b — thinks, tools</option>
      <option value="qwen2.5vl:3b">qwen2.5vl:3b — reads images</option>
      <option value="sd15">sd15 — makes images</option>
    </Select>
  )
}

function SizeGridDemo() {
  const [size, setSize] = useState({ cols: 2, rows: 2 })
  /* A bigger ceiling than the app's default 3x3. The point of the specimen is
     watching the grid grow, and at three steps it is over before you have seen
     what it does. */
  return <SizeGrid value={size} max={{ cols: 6, rows: 5 }} onChange={setSize} />
}

function TabsDemo() {
  const [at, setAt] = useState('model')
  return (
    <Tabs
      label="Settings section"
      value={at}
      onChange={setAt}
      tabs={[
        { id: 'model', label: 'Model' },
        { id: 'perm', label: 'Permissions', badge: '3' },
        { id: 'mem', label: 'Memories' },
        { id: 'gone', label: 'Discarded', disabled: true },
      ]}
    />
  )
}

/** The rail with headings over runs of tabs, as Settings draws it. The
 *  headings are not tabs: the arrows walk the four leaves and skip them. */
function GroupedTabsDemo() {
  const [at, setAt] = useState('assistant')
  return (
    <Tabs
      orientation="vertical"
      label="Settings section"
      value={at}
      onChange={setAt}
      groups={[
        {
          id: 'models',
          label: 'Models',
          hint: 'Who answers you, and what it draws and speaks with',
        },
        { id: 'tools', label: 'Tools & permissions', hint: 'What the tools may do' },
      ]}
      tabs={[
        { id: 'assistant', label: 'Assistant', group: 'models' },
        { id: 'speech', label: 'Speech', group: 'models' },
        { id: 'files', label: 'Files', group: 'tools' },
        { id: 'about', label: 'About', hint: 'Which build this is' },
      ]}
    />
  )
}

function ToastDemo() {
  const toast = useToast()
  return (
    <Row>
      <Button onPress={() => toast('Settings saved')}>Info</Button>
      <Button onPress={() => toast('Model removed', 'good')}>Good</Button>
      <Button tone="danger" onPress={() => toast('The download failed', 'bad')}>
        Bad
      </Button>
    </Row>
  )
}

function DialogDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onPress={() => setOpen(true)}>Ask something</Button>
      {open && (
        <Dialog
          title="Write to this folder?"
          onCancel={() => setOpen(false)}
          actions={
            <>
              <Button tone="ghost" onPress={() => setOpen(false)}>
                Not now
              </Button>
              <Button tone="primary" onPress={() => setOpen(false)}>
                Allow
              </Button>
            </>
          }
        >
          <div className="set-hint">
            <code className="mono">qwen3:4b</code> wants to write to
            <code className="mono"> ~/Documents/dev/tf</code>. Allowing this covers the whole folder
            until you revoke it in Settings.
          </div>
        </Dialog>
      )}
    </>
  )
}

/** Every figure, at a size you can actually judge one by. */
function Peeps({ tone }: { tone?: string }) {
  return (
    <div className="spec-peeps" style={tone ? { color: tone } : undefined}>
      {ILLUSTRATIONS.map((name) => (
        <figure key={name}>
          <Illustration name={name} size={120} />
          <figcaption className="mono">{name}</figcaption>
        </figure>
      ))}
    </div>
  )
}

function ModalDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onPress={() => setOpen(true)}>Open a window</Button>
      {open && (
        <Modal
          title="Model settings"
          subtitle={<span className="grow truncate muted mono">qwen3:8b</span>}
          onClose={() => setOpen(false)}
          width="min(520px, 100%)"
          footer={
            <>
              <Button tone="ghost" onPress={() => setOpen(false)}>
                Cancel
              </Button>
              <Button tone="primary" onPress={() => setOpen(false)}>
                Save
              </Button>
            </>
          }
        >
          <div className="set-row">
            <span className="grow">What to call it</span>
            <Input defaultValue="qwen3:8b" aria-label="What to call this model" />
          </div>
          <div className="set-row">
            <span className="grow">Keep loaded for</span>
            <span className="set-hint mono">5 minutes</span>
          </div>
        </Modal>
      )}
    </>
  )
}

function FieldDemo() {
  const [url, setUrl] = useState('mcp.example.com')
  /* Wrong on purpose, so the error state is the one you can actually look at
     rather than a screenshot in a docstring. */
  const bad = !url.startsWith('https://')
    ? 'Has to start with https:// — TF will not send a token over http.'
    : ''
  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)', maxWidth: 400 }}>
      <Field
        label="Server name"
        hint="How it appears in the tool list. Letters, digits and dashes."
      >
        {(f) => <Input {...f} defaultValue="linear" className="mono" />}
      </Field>
      <Field label="Server URL" required hint="An SSE or streamable-HTTP endpoint." error={bad}>
        {(f) => (
          <Input {...f} className="mono" value={url} onChange={(e) => setUrl(e.target.value)} />
        )}
      </Field>
    </div>
  )
}

function SliderDemo() {
  const [gb, setGb] = useState(12)
  const [pct, setPct] = useState(40)
  const [dangerV, setDangerV] = useState(90)
  return (
    <div style={{ maxWidth: 560 }}>
      <Slider
        label="Memory tf may take"
        hint="Half-gigabyte steps between what the smallest model needs and what this machine has."
        value={gb}
        min={2}
        max={19.5}
        step={0.5}
        onChange={setGb}
        format={(v) => `${v.toFixed(1)} GB`}
      />
      <Slider
        label="Continuous"
        hint="No step: the value is wherever the knob stopped."
        value={pct}
        min={0}
        max={100}
        onChange={setPct}
        format={(v) => `${Math.round(v)}%`}
      />
      <Slider
        label="Disabled"
        value={8}
        min={2}
        max={19.5}
        step={0.5}
        onChange={() => {}}
        format={(v) => `${v.toFixed(1)} GB`}
        disabled
      />
      <Slider
        label="With a risk past 80"
        hint="The fill drifts from the accent to the danger colour, step by step, past the mark."
        value={dangerV}
        min={50}
        max={95}
        step={5}
        danger={{ from: 80 }}
        onChange={setDangerV}
        format={(v) => `${v}%`}
      />
    </div>
  )
}

function SliderSizes() {
  const [v, setV] = useState(12)
  const f = (n: number) => `${n.toFixed(1)} GB`
  return (
    <div style={{ maxWidth: 560 }}>
      <Slider
        size="sm"
        label="Small — in a toolbar"
        value={v}
        min={2}
        max={19.5}
        step={0.5}
        onChange={setV}
        format={f}
      />
      <Slider
        size="md"
        label="Medium — the default"
        value={v}
        min={2}
        max={19.5}
        step={0.5}
        onChange={setV}
        format={f}
      />
      <Slider
        size="lg"
        label="Large — the only thing on the screen"
        value={v}
        min={2}
        max={19.5}
        step={0.5}
        onChange={setV}
        format={f}
      />
    </div>
  )
}

function ToggleDemo() {
  const [net, setNet] = useState(false)
  const [on, setOn] = useState(true)
  return (
    <div style={{ maxWidth: 420 }}>
      <Toggle label="Enabled" checked={on} onChange={setOn} />
      <Toggle
        label="Reach the internet"
        hint="Off by default. An applet that can fetch can also send."
        checked={net}
        onChange={setNet}
        said={net ? 'allowed' : 'blocked'}
      />
      <Toggle label="Trusted — cannot be changed here" checked disabled onChange={() => {}} />
    </div>
  )
}

function PickCard() {
  const [at, setAt] = useState('qwen3:4b')
  return (
    <div>
      {['bartowski/Qwen3-4B-GGUF', 'qwen3:4b'].map((id) => (
        <Card key={id} onClick={() => setAt(id)} selected={at === id}>
          <div className="row">
            <div className="grow">
              <div className="truncate">{id}</div>
              <div className="muted mono" style={{ marginTop: 'var(--space-1)' }}>
                2.50 GB · installed
              </div>
            </div>
            {at === id && (
              <Pill tone="info" inRow>
                in use
              </Pill>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}

function TimedCallout() {
  const [shown, setShown] = useState(true)
  const [slow, setSlow] = useState(true)
  return (
    <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <div className={`callout-enter${shown ? ' is-in' : ''}`}>
        <div>
          {shown && (
            <Callout tone="good" icon timed={slow ? true : 12000} onDismiss={() => setShown(false)}>
              Settings saved.
            </Callout>
          )}
        </div>
      </div>
      <Row>
        <Button
          onPress={() => {
            setSlow(true)
            setShown(true)
          }}
        >
          Show (5s)
        </Button>
        <Button
          onPress={() => {
            setSlow(false)
            setShown(true)
          }}
        >
          Show (12s)
        </Button>
      </Row>
    </div>
  )
}

function CheckboxDemo() {
  const [on, setOn] = useState<string[]>(['read_file'])
  const flip = (k: string) =>
    setOn((was) => (was.includes(k) ? was.filter((x) => x !== k) : [...was, k]))
  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)', maxWidth: 460 }}>
      {[
        ['read_file', 'Reads a file it has been allowed to see'],
        ['write_file', 'Writes one. Asks first, once per folder'],
        ['search_files', 'Looks for a string across the allowed folders'],
      ].map(([k, why]) => (
        <Checkbox
          key={k}
          label={<span className="mono">{k}</span>}
          why={why}
          checked={on.includes(k)}
          onChange={() => flip(k)}
        />
      ))}
    </div>
  )
}

export const COMPONENTS: Component[] = [
  {
    id: 'brand',
    name: 'Brand',
    blurb:
      'The wordmark: a lowercase tf in one unbroken stroke, the same path the ' +
      'app icon is rendered from, held to it by `test/brandMark.test.ts`. It ' +
      'was "TF" typeset in the system font, tracked until the pair read as one ' +
      'mark; a drawn line renders the same on a machine without SF Pro, and it ' +
      'has no join to get wrong. `currentColor`, so `.brand` decides the green ' +
      'and a theme can move it through `--good`.',
    variants: [
      {
        name: 'In the header',
        note:
          'Sized off the type scale — 1.5 times `--text-md`, the line box the ' +
          'old wordmark occupied — so the header kept its height when the letters ' +
          'became a drawing. The width follows the viewBox.',
        render: () => <Brand className="brand" />,
      },
    ],
  },
  {
    id: 'illustration',
    name: 'Illustration',
    blurb:
      'Open Peeps, redrawn in two classes so they wear the theme. The line takes ' +
      '`currentColor` and the fill takes `--panel`, which is the only reason one ' +
      'file can be right in Night, Paper and both halves of System — a hex ' +
      'in the artwork would mean two exports and a bug the first time a palette ' +
      'moved.',
    variants: [
      {
        name: 'All of them',
        note: 'Inherited colour, so they are whatever the surrounding text is.',
        render: () => <Peeps />,
      },
      {
        name: 'Given a colour',
        note:
          'Set `color` on anything above them. Nothing else changes — no second ' +
          'file, no filter, no variant prop.',
        render: () => <Peeps tone="var(--accent)" />,
      },
    ],
  },
  {
    id: 'empty',
    name: 'Empty',
    blurb:
      'A list with nothing in it, said properly: that it is empty, why if there is ' +
      'a why, and the thing you would do next. The settings panes used a bare ' +
      '`set-hint` for this — the same 12px muted line that describes the heading ' +
      'above it — so a pane with nothing in it looked like a pane that had failed ' +
      'to finish drawing.',
    variants: [
      {
        name: 'In a card',
        note:
          'Dashed, because the point of the box is that there is no thing in it ' +
          'yet — it marks out where the list will be. Quiet on purpose: the card ' +
          'around it already has the heading.',
        render: () => (
          <Empty icon="chat">
            Nothing yet. Notes are written after a conversation has been quiet for a couple of
            minutes.
          </Empty>
        ),
      },
      {
        name: 'A whole surface',
        note:
          'Pass `illustration` where the empty thing is the window rather than a ' +
          'slot in a card. The figure replaces the icon, the outline goes — a ' +
          'window-sized dashed rectangle reads as a layout that failed — and the ' +
          'box centres itself in whatever it was dropped into.',
        render: () => (
          <Empty illustration="uhm" action={<Button tone="primary">New applet</Button>}>
            Nothing on this view yet. An applet is a small thing a model writes for you and keeps
            here.
          </Empty>
        ),
      },
    ],
  },
  {
    id: 'rows',
    name: 'Rows',
    blurb:
      'Thirty-eight of these are assembled by hand — six nested elements, two of ' +
      'which exist only to stop the name eating the pills, and an inline ' +
      '`minWidth: 0` because a flex item will not shrink below its content. Miss ' +
      'that and a long name ellipsises away the tags, which is the half you ' +
      'could not have guessed.',
    variants: [
      {
        name: 'Default',
        note:
          'Name, pills, hint, actions. The container draws the rules between ' +
          'rows and none after the last.',
        render: () => (
          <Rows label="Installed models">
            <DataRow
              name="qwen3:8b"
              pills={
                <>
                  <Pill tone="info" inRow>
                    in use
                  </Pill>
                  <Pill inRow>thinks</Pill>
                  <Pill inRow>tools</Pill>
                </>
              }
              hint="10.62 GB · 27.3B · q4_K_M"
              actions={<Button size="sm">Remove</Button>}
            />
            <DataRow
              name="qwen2.5vl:3b"
              pills={<Pill inRow>reads images</Pill>}
              hint="3.2 GB · 3.8B · q4_K_M"
              actions={<Button size="sm">Remove</Button>}
            />
            <DataRow
              name="nomic-embed-text"
              pills={
                <Pill tone="warn" inRow>
                  not a chat model
                </Pill>
              }
              hint="274 MB · 137M"
              actions={<Button size="sm">Remove</Button>}
            />
          </Rows>
        ),
      },
      {
        name: 'With a trailing column',
        note:
          '`trail` is right-aligned and lines up down the list, which is why it ' +
          'is a slot rather than one more pill on the name’s line.',
        render: () => (
          <Rows label="Recent activity">
            <DataRow name="sd15 refined an image" hint="from the chat applet" trail="2 min ago" />
            <DataRow name="qwen3:8b read 4 files" hint="~/Documents/dev/tf" trail="18 min ago" />
            <DataRow name="ollama started" trail="1 hr ago" />
          </Rows>
        ),
      },
      {
        name: 'When the name is too long',
        note:
          'The name truncates and the pills keep their width — the failure this ' +
          'component exists to stop happening a third time.',
        render: () => (
          <div style={{ maxWidth: 460 }}>
            <Rows label="A long name">
              <DataRow
                name="qwen3-6-27b-fable-fusion-711-uncensored-heretic-nm-dau-neo-max-mtp"
                pills={
                  <>
                    <Pill inRow>thinks</Pill>
                    <Pill inRow>tools</Pill>
                  </>
                }
                hint="24.1 GB"
                actions={<Button size="sm">Remove</Button>}
              />
            </Rows>
          </div>
        ),
      },
      {
        name: 'Clickable',
        note:
          'A button, not a div with a handler, so it has a keyboard and a focus ' +
          'ring without anybody remembering to add them.',
        render: () => (
          <Rows label="Conversations">
            <DataRow
              name="Making a meme of a cat"
              hint="14 messages"
              trail="yesterday"
              onClick={() => {}}
            />
            <DataRow
              name="Why the tick sat high"
              hint="6 messages"
              trail="Tuesday"
              onClick={() => {}}
            />
          </Rows>
        ),
      },
      {
        name: 'Empty',
        note: 'Every caller writes this by hand today, and half of them forget.',
        render: () => <Rows label="Folders" empty="None — models cannot see any files." />,
      },
    ],
  },
  {
    id: 'table',
    name: 'Table',
    blurb:
      'For data you read across as well as down. If nobody will ever compare column ' +
      'three between row two and row nine, it is a list and belongs in Rows. A real ' +
      '`<table>`: a grid of divs looks the same and announces as a wall of ' +
      'unrelated text.',
    variants: [
      {
        name: 'Default',
        note:
          'First cell is a `th scope="row"`, numbers align right in tabular ' +
          'figures, and the last column’s heading is there for a screen reader ' +
          'and hidden on screen.',
        render: () => (
          <Table
            caption="Installed packages"
            keyOf={(p) => p.name}
            columns={[
              { header: 'Package', cell: (p) => <span className="mono">{p.name}</span> },
              { header: 'Version', cell: (p) => <span className="mono">{p.version}</span> },
              { header: 'Size', align: 'end', cell: (p) => p.size },
              {
                header: 'Pulled in by',
                cell: (p) => p.by ?? <span className="set-hint">asked for</span>,
              },
              {
                header: 'Actions',
                quiet: true,
                cell: () => (
                  <Button tone="danger" size="sm">
                    Remove
                  </Button>
                ),
              },
            ]}
            rows={[
              { name: 'pillow', version: '11.1.0', size: '4.2 MB', by: null },
              { name: 'numpy', version: '2.2.1', size: '18.9 MB', by: 'pillow' },
              { name: 'httpx', version: '0.28.1', size: '1.1 MB', by: null },
              { name: 'anyio', version: '4.8.0', size: '412 KB', by: 'httpx' },
            ]}
          />
        ),
      },
      {
        name: 'Empty',
        render: () => (
          <Table
            caption="Packages"
            keyOf={(x: { name: string }) => x.name}
            columns={[]}
            rows={[]}
            empty="Nothing installed yet."
          />
        ),
      },
    ],
  },
  {
    id: 'toggle',
    name: 'Toggle',
    blurb:
      'A checkbox collects an answer and applies it when you press Save. A switch ' +
      '*is* the action — it changes the thing as it moves. Six settings in the ' +
      'app saved immediately and were all drawn as tick boxes, promising a Save ' +
      'button that does not exist.',
    variants: [
      {
        name: 'Default',
        note:
          '`role="switch"`, so it is announced as on/off rather than ' +
          'checked/unchecked — the only signal a non-visual reader gets that it ' +
          'applies now. The whole row is the label, because 30×18 is under every ' +
          'target minimum there is.',
        render: () => <ToggleDemo />,
      },
      {
        name: 'Sizes',
        note:
          'The same three names every other control takes. The switch scales with ' +
          'the row — a 30×18 track beside 12px text is a different control from ' +
          'the same track beside 16px text.',
        render: () => (
          <div style={{ maxWidth: 420 }}>
            <Toggle
              size="sm"
              label="Small — in a toolbar or a dense row"
              checked
              onChange={() => {}}
            />
            <Toggle size="md" label="Medium — the default" checked onChange={() => {}} />
            <Toggle
              size="lg"
              label="Large — the only thing on the screen"
              checked
              onChange={() => {}}
            />
          </div>
        ),
      },
    ],
  },
  {
    id: 'slider',
    name: 'Slider',
    blurb:
      'A number chosen from a range, by dragging. For a setting whose answer is ' +
      '“about this much” rather than one of a list — how much memory tf may take. ' +
      'Bounded always, stepped optionally, and it applies when the knob is let go ' +
      'while the value beside it follows the drag.',
    variants: [
      {
        name: 'Stepped, continuous, disabled',
        note:
          'A native range, so the keyboard and the announcement come free; ' +
          '`aria-valuetext` says the value in the caller’s words. The fill is the ' +
          'value: “this much of that” without a second element.',
        render: () => <SliderDemo />,
      },
      {
        name: 'Sizes',
        note:
          'The same three names every other control takes, scaled the way ' +
          'Toggle’s are — and the same three boxes as `size-sm`, `size-md` and ' +
          '`size-lg` on a button or a select, so the controls of one size line up.',
        render: () => <SliderSizes />,
      },
    ],
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    blurb:
      'The shape of what has not arrived yet. Ported from chef-monorepo, keeping ' +
      'its API and its convention that a bare number is a 4px step — which lands ' +
      'exactly on this app’s spacing grid. A skeleton is a promise about layout: ' +
      'if you cannot say what shape is coming, use Progress, which claims nothing.',
    variants: [
      {
        name: 'Shapes',
        note: '`height={5}` is 20px. A string is used as given.',
        render: () => (
          <Row>
            <Skeleton width={40} height={5} />
            <Skeleton width={40} height={5} variant="rounded" />
            <Skeleton width={12} height={12} variant="circular" />
          </Row>
        ),
      },
      {
        name: 'A paragraph',
        note:
          'The last line is short, because real paragraphs end mid-line and a ' +
          'stack of equal bars reads as a table waiting to load.',
        render: () => (
          <div style={{ maxWidth: 420 }}>
            <Skeleton lines={4} height={3} variant="rounded" />
          </div>
        ),
      },
      {
        name: 'The shape of a row',
        note:
          'What the download list shows while it asks Hugging Face. The rows are ' +
          'the size of the rows about to arrive, so nothing jumps when they land.',
        render: () => (
          <div>
            {[0, 1, 2].map((i) => (
              <div className="card" key={i}>
                <div className="row">
                  <div className="grow">
                    <Skeleton width={`${52 - i * 9}%`} height={4} variant="rounded" />
                    <div style={{ marginTop: 'var(--space-2)' }}>
                      <Skeleton width="34%" height={3} variant="rounded" />
                    </div>
                  </div>
                  <Skeleton width={28} height={9} variant="rounded" />
                </div>
              </div>
            ))}
          </div>
        ),
      },
      {
        name: 'Still',
        note:
          '`animation="none"` for a placeholder rather than a wait — and reduced ' +
          'motion turns the pulse off everywhere regardless.',
        render: () => (
          <Row>
            <Skeleton width={40} height={5} variant="rounded" animation="none" />
            <Skeleton width={40} height={5} variant="rounded" surface="elevated" animation="none" />
          </Row>
        ),
      },
    ],
  },
  {
    id: 'progress',
    name: 'Progress',
    blurb:
      'There was a six-pixel `.bar` and every caller did its own arithmetic and ' +
      'formatting. The reason this exists is the indeterminate case: a fetch ' +
      'that has not read `content-length` yet drew an empty track, which is the ' +
      'same picture as stalled.',
    variants: [
      {
        name: 'Determinate',
        render: () => (
          <div style={{ display: 'grid', gap: 14 }}>
            <Progress label="ollama-darwin.tgz" value={62} max={100} detail="412 MB of 660 MB" />
            <Progress label="Installed" value={100} max={100} detail="done" tone="good" />
          </div>
        ),
      },
      {
        name: 'Indeterminate',
        note: 'Working, size unknown. Says something is happening without claiming to know how much is left.',
        render: () => <Progress label="Fetching" detail="contacting GitHub…" />,
      },
      {
        name: 'Failed',
        render: () => (
          <Progress
            label="sd15 weights"
            value={38}
            max={100}
            detail="404 from Hugging Face"
            tone="bad"
          />
        ),
      },
    ],
  },
  {
    id: 'tabs',
    name: 'Tabs',
    blurb:
      'Written three times already — the board tabs, Settings’ eleven panes, the ' +
      'studio’s editor/preview switch — each with its own markup and its own ' +
      'idea of what a keyboard should do, which in two of three was nothing. ' +
      'The strip is one tab stop and the arrows move along it.',
    variants: [
      { name: 'Default', render: () => <TabsDemo /> },
      { name: 'Vertical, grouped', render: () => <GroupedTabsDemo /> },
    ],
  },
  {
    id: 'toast',
    name: 'Toast',
    blurb:
      'There is no transient feedback in this app at all — “saved”, “copied”, ' +
      '“model removed” are silent. A toast is for the outcome you would not ' +
      'have chased: if you must act on it, it is a Callout; if you must decide, ' +
      'it is a Dialog.',
    variants: [
      {
        name: 'Tones',
        note: '`role="status"`, except the failing one, which is an `alert` — an alert interrupts a screen reader, right for bad news and rude for “copied”.',
        render: () => (
          <ToastHost>
            <ToastDemo />
          </ToastHost>
        ),
      },
    ],
  },
  {
    id: 'dialog',
    name: 'Dialog',
    blurb:
      'A question that stops what you were doing. Approval, AppletAsk and ' +
      'AppletReview are all this shape and all built it from scratch — none ' +
      'trapped focus, none restored it, and two could be dismissed by clicking ' +
      'the scrim, which for “may this applet write to your files” is a way of ' +
      'answering no by accident.',
    variants: [
      {
        name: 'Default',
        note: 'Focus moves in, is trapped, and goes back where it came from. The scrim decides nothing.',
        render: () => <DialogDemo />,
      },
    ],
  },
  {
    id: 'button',
    name: 'Button',
    blurb:
      'Four kinds that now look like four things. Ghost had no rule at all — a ' +
      'default button with a class that did nothing — and danger only turned red ' +
      'on hover, which is the one moment it is too late to be told.',
    variants: [
      {
        name: 'Kinds',
        render: () => (
          <Row>
            <Button>Default</Button>
            <Button tone="primary">Primary</Button>
            <Button tone="ghost">Ghost</Button>
            <Button tone="danger">Danger</Button>
          </Row>
        ),
      },
      {
        name: 'Disabled',
        note: 'A disabled primary gives up its fill. At 45% opacity it was still a coloured fill — the one button you cannot press was the loudest thing on the panel.',
        render: () => (
          <Row>
            <Button isDisabled>Default</Button>
            <Button tone="primary" isDisabled>
              Primary
            </Button>
            <Button tone="ghost" isDisabled>
              Ghost
            </Button>
            <Button tone="danger" isDisabled>
              Danger
            </Button>
          </Row>
        ),
      },
      {
        name: 'Busy',
        note: 'Working, not disabled. On `aria-busy`, so the styling and the screen reader read the same attribute; holds still under prefers-reduced-motion.',
        render: () => (
          <Row>
            <Button tone="primary" busy>
              Installing…
            </Button>
            <Button busy>Removing…</Button>
          </Row>
        ),
      },
      {
        name: 'Sizes',
        note: 'Asked for, not inherited. Four sizes existed before and every one came from a descendant selector — a button’s size was a fact about where it had been put.',
        render: () => (
          <Row>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button tone="primary" size="lg">
              Install
            </Button>
          </Row>
        ),
      },
      {
        name: 'Sizes agree across controls',
        note: 'One scale for buttons, selects and inputs, so a row of mixed controls lines up without anyone measuring.',
        render: () => (
          <div style={{ display: 'grid', gap: 10 }}>
            {(['sm', 'md', 'lg'] as const).map((z) => (
              <Row key={z}>
                <Button size={z}>Button</Button>
                <Select aria-label="Model" size={z} defaultValue="a">
                  <option value="a">Select</option>
                  <option value="b">Another</option>
                </Select>
                <Input size={z} aria-label="Input" defaultValue="Input" style={{ width: 140 }} />
              </Row>
            ))}
          </div>
        ),
      },
      {
        name: 'Icon only',
        note: 'Every one carries an aria-label — an icon-only button without a name is the first anti-pattern on the list.',
        render: () => (
          <Row>
            <Button iconOnly aria-label="Settings">
              <Icon name="settings" />
            </Button>
            <Button iconOnly aria-label="Chat">
              <Icon name="chat" />
            </Button>
            <Button iconOnly aria-label="Refresh">
              <Icon name="refresh" />
            </Button>
            <Button iconOnly aria-label="Minimise">
              <Icon name="minimize" />
            </Button>
            <Button iconOnly aria-label="Studio">
              <Icon name="code" />
            </Button>
          </Row>
        ),
      },
    ],
  },
  {
    id: 'callout',
    name: 'Callout',
    blurb:
      'Something the page needs to say, beside the thing it is about. Not a Toast: ' +
      'a toast floats over the page and takes no space, and “this server is not ' +
      'answering” belongs next to the server. 31 call sites assembled this by ' +
      'hand before it was a component.',
    variants: [
      {
        name: 'Tones',
        note:
          'The four the app uses everywhere — the same words `Pill` and `Toast` ' +
          'use. `bad` is announced as an alert; the rest are a status.',
        render: () => (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <Callout>A plain one. No tone, no mark — most of them are this.</Callout>
            <Callout tone="info" icon>
              Ollama is already running, so TF will use it.
            </Callout>
            <Callout tone="good" icon>
              Installed and answering.
            </Callout>
            <Callout tone="warn" icon>
              This tool can write. Calls will ask first.
            </Callout>
            <Callout tone="bad" icon>
              Hugging Face answered 404.
            </Callout>
          </div>
        ),
      },
      {
        name: 'Timed',
        note:
          'Five seconds by default, with a countdown bar. Hover to hold it — a ' +
          'message that expires while you are reading it was never shown. Only ' +
          'for things that are safe to have missed: nothing with a button, and ' +
          'nothing you have to act on.',
        render: () => <TimedCallout />,
      },
      {
        name: 'The mark',
        note:
          'From the icon set. It used to be a letter typed into a ring — the OS ' +
          'font drawing a glyph beside an app that has an icon for it, inside a ' +
          'circle that said the same thing twice.',
        render: () => (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <Callout tone="warn" icon="download">
              A 16 GB download over a metered connection.
            </Callout>
            <Callout tone="info" icon="wifi-off">
              Offline — local models only.
            </Callout>
          </div>
        ),
      },
    ],
  },
  {
    id: 'pill',
    name: 'Pill',
    blurb:
      'A word attached to a thing. Three jobs, three weights: a measurement is ' +
      'quiet, a capability is a plain chip, and a state is the only one that ' +
      'takes colour.',
    variants: [
      {
        name: 'Quiet',
        note:
          'A measurement. Nothing to act on, so no box — it reads as text that ' +
          'happens to sit in a row.',
        render: () => (
          <Row>
            <Pill quiet>10.62 GB</Pill>
            <Pill quiet>stdio</Pill>
            <Pill quiet>4 shards</Pill>
          </Row>
        ),
      },
      {
        name: 'Capability',
        note:
          'What the thing can do. A set, scanned across, so they share one look ' +
          'and none of them is louder than the others.',
        render: () => (
          <Row>
            <Pill>thinks</Pill>
            <Pill>tools</Pill>
            <Pill>reads images</Pill>
            <Pill>draws</Pill>
          </Row>
        ),
      },
      {
        name: 'State',
        note:
          'The four tones `Callout` uses, so one vocabulary covers the app. ' +
          '`warn` is for a caution — the thing works, mind how — and `bad` for ' +
          'something that is actually not working.',
        render: () => (
          <Row>
            <Pill tone="info">in use</Pill>
            <Pill tone="good">signed in</Pill>
            <Pill tone="warn">writes</Pill>
            <Pill tone="bad">sign-in expired</Pill>
          </Row>
        ),
      },
      {
        name: 'After a name',
        note:
          'The three weights together, which is how they are actually met: one ' +
          'state, two capabilities, and the size left as text.',
        render: () => (
          <div className="set-row">
            <span className="grow">
              <span className="named">
                <span className="truncate">qwen3-8-27b-uncensored</span>
                <Pill tone="info" inRow>
                  in use
                </Pill>
                <Pill inRow>thinks</Pill>
                <Pill inRow>tools</Pill>
              </span>
              <div className="set-hint">10.62 GB · 27.3B · quantisation not recorded</div>
            </span>
          </div>
        ),
      },
      {
        name: 'When the name is too long',
        note: 'The name truncates and the pills keep their width. They used to be what got ellipsised away.',
        render: () => (
          <div className="set-row" style={{ maxWidth: 420 }}>
            <span className="grow" style={{ minWidth: 0 }}>
              <span className="named">
                <span className="truncate">
                  qwen3-6-27b-fable-fusion-711-uncensored-heretic-nm-dau-neo-max-mtp
                </span>
                <Pill inRow>reads images</Pill>
              </span>
              <div className="set-hint">12.60 GB · 26.9B · IQ2_M</div>
            </span>
          </div>
        ),
      },
    ],
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    blurb:
      'Several options you pick from. One binary decision is a Toggle — fifteen ' +
      'switches in a column read as fifteen unrelated settings rather than one ' +
      'choice with fifteen parts. The native box is hidden, not styled: a ' +
      'checkbox styles down to a square and the tick inside stays the OS’s.',
    variants: [
      {
        name: 'A set',
        note: 'The whole row is the label, so clicking anywhere in it toggles.',
        render: () => <CheckboxDemo />,
      },
      {
        name: 'The parts',
        render: () => (
          <div style={{ display: 'grid', gap: 'var(--space-2)', maxWidth: 460 }}>
            <Checkbox label="Just a name" checked onChange={() => {}} />
            <Checkbox
              label="With a reason"
              why="What choosing it means, or what it costs."
              checked={false}
              onChange={() => {}}
            />
            <Checkbox
              label="With a third line"
              why="A quieter one — a path, a size, an id."
              meta="~/models/qwen"
              checked
              onChange={() => {}}
            />
            <Checkbox
              label="Disabled"
              why="Cannot be chosen here."
              checked={false}
              disabled
              onChange={() => {}}
            />
          </div>
        ),
      },
    ],
  },
  {
    id: 'select',
    name: 'Select',
    blurb:
      'A native select with the browser’s chevron dropped and ours put back. The ' +
      'closed control is ours; the open list belongs to the operating system and ' +
      'cannot be styled — which is the reason to replace it.',
    variants: [
      { name: 'Default', render: () => <SelectDemo /> },
      {
        name: 'Block',
        note: 'Full width, for a select that is the subject of its pane rather than a field in it.',
        render: () => <SelectDemo block />,
      },
      {
        name: 'Disabled',
        render: () => (
          <Select aria-label="Theme" disabled defaultValue="a">
            <option value="a">Anthropic’s to set</option>
          </Select>
        ),
      },
    ],
  },
  {
    id: 'input',
    name: 'Input',
    blurb:
      'Almost every input in the app was labelled by its placeholder — which ' +
      'disappears the moment you type, so the one time you want to know what a ' +
      'field was for is the one time it is gone. And thirty errors were red text ' +
      'near a field, associated with nothing. `Field` is the wrapper that fixes ' +
      'both; the bare control is what it wraps.',
    variants: [
      {
        name: 'Labelled',
        note:
          'Description above the input, error below — the order they are wanted ' +
          'in. Type a valid https:// URL and the second one recovers.',
        render: () => <FieldDemo />,
      },
      {
        name: 'The parts',
        note:
          'Both messages are wired to the input with `aria-describedby`, and an ' +
          'invalid field carries `aria-invalid` — so red is the third signal, ' +
          'never the only one.',
        render: () => (
          <div style={{ display: 'grid', gap: 'var(--space-5)', maxWidth: 400 }}>
            <Field label="Plain">{(f) => <Input {...f} />}</Field>
            <Field label="With a description" hint="What to put in it, or what it will do.">
              {(f) => <Input {...f} />}
            </Field>
            <Field label="Required" required hint="The word, not just the asterisk.">
              {(f) => <Input {...f} />}
            </Field>
            <Field label="In error" error="Something is wrong with this one.">
              {(f) => <Input {...f} defaultValue="nope" />}
            </Field>
            <Field
              label="Hidden label"
              labelHidden
              hint="Announced, not drawn — for a box under a heading that already names it."
            >
              {(f) => <Input {...f} placeholder="Search…" />}
            </Field>
          </div>
        ),
      },
      {
        name: 'Password',
        note:
          'An eye that shows what you typed, so a token is not retyped until it ' +
          'takes. A React Aria toggle: `aria-pressed` says which state it is in, ' +
          'the label stays "Show password" in both, and the box is still the one ' +
          "`<input>` -- `Field`'s wiring lands on it as before. Revealed text " +
          'stops autocorrecting, because a phone keyboard treats a visible field ' +
          'as prose.',
        render: () => (
          <div style={{ display: 'grid', gap: 'var(--space-5)', maxWidth: 400 }}>
            <Field label="Token" hint="Pasted, usually — which is exactly when you want to see it.">
              {(f) => <Input {...f} type="password" defaultValue="tf_live_8f3a9c2e1b7d" mono />}
            </Field>
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <Input type="password" size="sm" defaultValue="hunter2" aria-label="Small password" />
              <Input type="password" defaultValue="hunter2" aria-label="Medium password" />
              <Input type="password" size="lg" defaultValue="hunter2" aria-label="Large password" />
            </div>
            <Field label="Disabled">
              {(f) => <Input {...f} type="password" defaultValue="hunter2" disabled />}
            </Field>
          </div>
        ),
      },
      {
        name: 'The bare control',
        note:
          'What `Field` wraps. On its own only where the surroundings already ' +
          'name it — which is rarer than it looks.',
        render: () => (
          <Row>
            <Input aria-label="Your name" placeholder="Your name" />
            <Input aria-label="With a value" defaultValue="With a value" />
            <Input aria-label="Disabled" placeholder="Disabled" disabled />
          </Row>
        ),
      },
    ],
  },
  {
    id: 'textarea',
    name: 'Textarea',
    blurb:
      'Not resizable by hand. The chat composer grows with what you type and the ' +
      'drag handle fought it — you would size it, type a line, and it would ' +
      'snap back.',
    variants: [
      {
        name: 'Labelled',
        note: 'Same wiring as an input — `Field` takes any control.',
        render: () => (
          <div style={{ display: 'grid', gap: 'var(--space-5)', maxWidth: 420 }}>
            <Field label="Environment" hint="One per line. Optional.">
              {(f) => <Textarea {...f} rows={2} placeholder="TOKEN=…" />}
            </Field>
            <Field label="System prompt" error="Too long — this model takes 8k of context.">
              {(f) => <Textarea {...f} rows={2} defaultValue="You are a…" />}
            </Field>
          </div>
        ),
      },
      {
        name: 'The bare control',
        render: () => (
          <div style={{ display: 'grid', gap: 'var(--space-3)', maxWidth: 420 }}>
            <Textarea aria-label="Message" rows={3} placeholder="Message… (Enter to send)" />
            <Textarea aria-label="Disabled" rows={3} disabled defaultValue="Disabled" />
          </div>
        ),
      },
    ],
  },
  {
    id: 'sizegrid',
    name: 'SizeGrid',
    blurb: 'Tile size, as a picture of the thing it sets rather than a number.',
    variants: [
      {
        name: 'Interactive',
        note: 'Shown at 6×5 so the growth is visible; the app ships a 3×3 ceiling.',
        render: () => <SizeGridDemo />,
      },
    ],
  },
  {
    id: 'card',
    name: 'Card',
    blurb:
      'This page listed a Card for weeks and there was no Card — just `.card` CSS ' +
      'and four hand-assembled variants of the same header, no two agreeing on ' +
      'the gap between the title and the line under it. A catalogue that ' +
      'describes a component nobody can import is worse than no catalogue.',
    variants: [
      {
        name: 'Title and description',
        note:
          'Both are props. The icon is optional and always `aria-hidden` — beside ' +
          'a title that says the same word, it is the word twice to a reader.',
        render: () => (
          <div className="spec-cards">
            <Card
              icon="chat"
              title="A model to talk to"
              description="The one that answers questions and writes things. Start here if you are only picking one."
            >
              <Button tone="primary" block>
                Choose one
              </Button>
            </Card>
            <Card
              icon="image"
              title="A model that draws"
              description="Makes pictures from a description. Bigger, slower, and not needed for anything else to work."
            >
              <Button block>Choose one</Button>
            </Card>
          </div>
        ),
      },
      {
        name: 'Holding rows',
        note:
          'A card that groups things takes a title like any other. There used to ' +
          'be a second `.card-head` for this — same class name, different rule — ' +
          'used by nothing but the page documenting it.',
        render: () => (
          <Card icon="settings" title="Engines" className="card-flat">
            <div className="set-row">
              <span className="grow">
                ollama<div className="set-hint">v0.33.2 · running</div>
              </span>
              <Button tone="ghost" size="sm">
                Remove
              </Button>
            </div>
            <div className="set-row">
              <span className="grow">
                stable-diffusion.cpp<div className="set-hint">not installed</div>
              </span>
              <Button tone="primary" size="sm">
                Install
              </Button>
            </div>
          </Card>
        ),
      },
      {
        name: 'Selectable',
        note:
          '`onClick` makes the card a `<Button>`, so it gets a keyboard and a ' +
          'focus ring instead of a hover state and nothing else.',
        render: () => <PickCard />,
      },
      {
        name: 'Failed',
        note:
          'Something wrong with this one specifically, as against a Callout about ' +
          'the whole page.',
        render: () => (
          <Card tone="bad">
            <div className="row">
              <div className="grow">
                <div className="truncate">stable-diffusion-v1-5-pruned-emaonly-Q4_0.gguf</div>
                <div className="muted mono" style={{ marginTop: 'var(--space-1)' }}>
                  Hugging Face answered 404
                </div>
              </div>
              <Button tone="ghost">Retry</Button>
            </div>
          </Card>
        ),
      },
      {
        name: 'Warned',
        note:
          'Rows that want reading before touching -- Settings > Agents > Advanced. ' +
          "The warn Callout's colours on a card, so a warning that grew rows keeps " +
          'its tone rather than sitting under a callout that says "be careful" and ' +
          'then ends.',
        render: () => (
          <Card
            icon="warning"
            tone="warn"
            title="Advanced"
            description="These change how the model engine runs. Saving one restarts it."
          >
            <div className="set-row">
              <span className="grow">
                <strong>Runs requests</strong>
                <div className="set-hint">One at a time, or several per step.</div>
              </span>
              <Select aria-label="How the engine runs requests" defaultValue="serialise">
                <option value="serialise">One at a time</option>
                <option value="batch">Batched</option>
              </Select>
            </div>
          </Card>
        ),
      },
      {
        name: 'Bare',
        note:
          'No title, no icon — a box around a row. Most of the app’s cards are ' +
          'this, and they stay this.',
        render: () => (
          <Card>
            <div className="row">
              <div className="grow">
                <div className="truncate">unsloth/Qwen2.5-VL-7B-Instruct-GGUF</div>
                <div className="muted mono" style={{ marginTop: 'var(--space-1)' }}>
                  1,204,993 downloads · 412 likes · apache-2.0
                </div>
              </div>
              <Button>Choose quant</Button>
            </div>
          </Card>
        ),
      },
    ],
  },
  {
    id: 'modal',
    name: 'Modal',
    blurb:
      'Eight of these were built by hand from `.backdrop` and `.modal`, and not ' +
      'one trapped focus — so Tab past the last button and you were on the page ' +
      'behind it, operating controls under the scrim that you could not see. No ' +
      'mouse ever finds that, which is why it survived eight implementations.',
    variants: [
      {
        name: 'Default',
        note:
          'Focus moves in, is kept in, and goes back to the control that opened ' +
          'it. Escape and the ✕ close; the scrim closes a workspace, because that ' +
          'is what the app already did and losing a workspace costs one click.',
        render: () => <ModalDemo />,
      },
      {
        name: 'Shown inline',
        note:
          'The same parts, unportalled, so the shape is visible without covering ' + 'the page.',
        render: () => (
          <div className="modal" style={{ position: 'static', maxWidth: 460 }}>
            <header className="modal-head">
              <strong>Welcome</strong>
              <span className="grow" />
              <span className="set-hint mono">1 of 4</span>
            </header>
            <div className="modal-body">
              <section className="set">
                <h4>The engine</h4>
                <div className="set-hint">TF does not run models itself — Ollama does.</div>
              </section>
            </div>
            <footer className="set-actions first-run-actions">
              <span className="grow" />
              <Button tone="primary" isDisabled>
                Next
              </Button>
            </footer>
          </div>
        ),
      },
    ],
  },
  {
    id: 'text',
    name: 'Text',
    blurb:
      'Seven sizes, all from one scale. There were eleven raw values before — ' +
      'including 10.5px — and `--font-size` was used exactly once.',
    variants: [
      {
        name: 'Registers',
        render: () => (
          <div>
            <div>Ordinary body text, at the base size.</div>
            <div className="muted">Muted — secondary, still readable.</div>
            <div className="set-hint">Hint — the small print under a control.</div>
            <div className="mono">mono — paths, ids, anything you might copy</div>
          </div>
        ),
      },
      {
        name: 'The scale',
        render: () => (
          <div style={{ display: 'grid', gap: 6 }}>
            {(['2xs', 'xs', 'sm', 'base', 'md', 'lg', 'xl'] as const).map((s) => (
              <div key={s} style={{ fontSize: `var(--text-${s})` }}>
                <span className="mono set-hint">--text-{s}</span> The quick brown fox
              </div>
            ))}
          </div>
        ),
      },
      {
        name: 'Markdown',
        note: 'What a model answers with, rendered.',
        render: () => (
          <Markdown
            text={
              '**Two things** worth knowing:\n\n1. It runs locally\n2. It costs nothing\n\n' +
              'Try `ollama list`, or see [the docs](https://example.com).\n\n' +
              '```python\nprint("hello")\n```\n'
            }
          />
        ),
      },
    ],
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    blurb:
      'The inline “what is this”. It was called Explain, which named the ' +
      'intention rather than the thing — so nobody looking for a tooltip would ' +
      'have found it.',
    variants: [
      {
        name: 'Default',
        render: () => (
          <Tooltip label="what is this?">
            Reasoning is generated separately from the answer and shown in its own pane, so a model
            that thinks for a minute is visibly working.
          </Tooltip>
        ),
      },
    ],
  },
  {
    id: 'icon',
    name: 'Icon',
    blurb:
      'Pepicons Pencil, hand-drawn, chosen to sit with the Open Peeps ' +
      'illustrations rather than against them — Material Symbols was the set ' +
      'before, and a filled glyph beside a line drawing reads as two products. ' +
      'Each glyph carries a measured viewBox rather than its shipped one: ' +
      'Pepicons draws to no consistent optical size, so `close` filled 40% of ' +
      'its box where `wifi-off` filled 90%. Inlined as paths rather than ' +
      'installed: a font has to load before anything draws, and this app opens ' +
      'offline on a machine that has just downloaded it. CC BY 4.0 — Pepicons ' +
      'by Christoph Kuehl, pepicons.com.',
    variants: [
      {
        name: 'The set',
        render: () => (
          <div className="spec-icons">
            {ICON_NAMES.map((n) => (
              <div key={n} className="spec-icon">
                <Icon name={n} size={22} />
                <span className="set-hint mono">{n}</span>
              </div>
            ))}
          </div>
        ),
      },
      {
        name: 'Sizes',
        note: 'One number, because they are square and always have been.',
        render: () => (
          <Row>
            {[14, 16, 18, 22, 28].map((n) => (
              <Icon key={n} name="settings" size={n} />
            ))}
          </Row>
        ),
      },
      {
        name: 'In a button',
        note: 'Takes `currentColor`, so it never needs a variant for a tone.',
        render: () => (
          <Row>
            <Button iconOnly aria-label="Settings">
              <Icon name="settings" />
            </Button>
            <Button iconOnly aria-label="Chat">
              <Icon name="chat" />
            </Button>
            <Button tone="danger">
              <Icon name="close" size={15} /> Remove
            </Button>
            <Button tone="primary">
              <Icon name="download" size={15} /> Install
            </Button>
          </Row>
        ),
      },
      {
        name: 'Working',
        note: 'A rotation, not a bounce: the dashboard re-renders every five seconds and a replaced node restarts its animation — a spin has no perceptible start, so the restart is invisible.',
        render: () => (
          <Row>
            <Icon name="spinner" className="spin" />
            <Icon name="spinner" className="spin" size={22} />
            <Button tone="primary" busy>
              <Icon name="spinner" className="spin" size={15} /> Installing…
            </Button>
          </Row>
        ),
      },
    ],
  },
]
