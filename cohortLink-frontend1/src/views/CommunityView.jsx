import { Title, Container, Text } from '@mantine/core';

export default function CommunityView() {
  return (
    <main id="main-content" role="main" className="flex-1 flex flex-col p-6">
      <Container size="xl" className="w-full">
        <Title order={1} className="text-white mb-4">Community</Title>
        <Text c="dimmed">Community discussions and members will appear here.</Text>
      </Container>
    </main>
  );
}
