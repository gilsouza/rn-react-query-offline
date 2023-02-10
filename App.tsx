/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createAsyncStoragePersister} from '@tanstack/query-async-storage-persister';
import {
  MutationCache,
  onlineManager,
  QueryClient,
  useMutation,
} from '@tanstack/react-query';
import {PersistQueryClientProvider} from '@tanstack/react-query-persist-client';
import NetInfo from '@react-native-community/netinfo';

import {Colors, Header} from 'react-native/Libraries/NewAppScreen';
import axios from 'axios';

if (__DEV__) {
  import('./reactotron-config').then(() =>
    console.log('Reactotron Configured'),
  );
}

// this is important define network status
// use event listener with react-native-netinfo
// false => the mutation should not run and cached in storage
// true => the mutation run normally
// onlineManager.setOnline(false);

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  // throttleTime: 5000,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // cacheTime: 1000 * 60 * 60 * 24, // 24 hours
      // staleTime: 2000,
      retry: 5,
    },
  },
  mutationCache: new MutationCache({
    onSuccess: (data: any) => {
      console.log('@@@@ mutationCache onSuccess', data);
    },
    onError: (error: any) => {
      console.log('@@@@ mutationCache onError', error);
    },
  }),
});

queryClient.setMutationDefaults(['offlineMutations'], {
  mutationFn: async () => axios.post('https://demo6071874.mockable.io/lalala'), // simple mock
});

function UseOfflineMutation() {
  const offlineMutation = useMutation({
    mutationKey: ['offlineMutations'],
    networkMode: 'always', // force offline execution
    onMutate(variables) {
      console.log('@@@ UseOfflineMutation onMutate - variables', variables);
    },
  });

  return {offlineMutation};
}

function EmptyComponent() {
  const {offlineMutation} = UseOfflineMutation();

  // uncomment to test request on app open
  useEffect(() => {
    offlineMutation.mutate();
  }, []);

  return null;
}

function App(): JSX.Element {
  const [isOnline, setIsOnline] = useState<boolean>();
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(({isConnected}) => {
      setIsOnline(!!isConnected);
      onlineManager.setOnline(!!isConnected);
    });
    return () => unsubscribe();
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{persister}}
      onSuccess={() => {
        // resume mutations after initial restore from localStorage was successful
        queryClient
          .resumePausedMutations()
          .then(() => {
            console.log('@@@@@@ resumePausedMutations invalidateQueries');
            queryClient.invalidateQueries();
          })
          .catch(error =>
            console.log('@@@@@@ resumePausedMutations error', error),
          );
      }}>
      <SafeAreaView style={backgroundStyle}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={backgroundStyle}>
          <Header />
          <View
            style={{
              backgroundColor: isDarkMode ? Colors.black : Colors.white,
            }}>
            <Text>{isOnline ? 'Online' : 'Offline'}</Text>
            <EmptyComponent />
          </View>
        </ScrollView>
      </SafeAreaView>
    </PersistQueryClientProvider>
  );
}

export default App;
