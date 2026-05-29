import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: Array<{ name: string; title: string; icon: IconName; activeIcon: IconName }> = [
  { name: 'index', title: 'Ana Sayfa', icon: 'home-outline', activeIcon: 'home' },
  { name: 'vocabulary', title: 'Kelimeler', icon: 'book-outline', activeIcon: 'book' },
  { name: 'roleplay', title: 'Konuşma', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles' },
  { name: 'content', title: 'İçerik', icon: 'play-circle-outline', activeIcon: 'play-circle' },
  { name: 'profile', title: 'Profil', icon: 'person-outline', activeIcon: 'person' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#E4E1F5',
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: '#8B6EFF',
        tabBarInactiveTintColor: '#9B94CC',
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? tab.activeIcon : tab.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
