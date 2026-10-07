import { Empty, PageHeader, TabScreen } from '../components/ui'

/** Placeholder until the friends backend exists (design/screens/Friends.html). */
export default function Friends() {
  return (
    <TabScreen>
      <PageHeader title="Friends" />
      <div className="mt-4">
        <Empty>Friends are coming soon: see how your friends are doing today and log what they ate.</Empty>
      </div>
    </TabScreen>
  )
}
