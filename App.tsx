/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {createAsyncStoragePersister} from '@tanstack/query-async-storage-persister';
import {
  MutationCache,
  onlineManager,
  QueryClient,
  useMutation,
} from '@tanstack/react-query';
import {PersistQueryClientProvider} from '@tanstack/react-query-persist-client';
import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableHighlight,
  useColorScheme,
  View,
} from 'react-native';

import axios from 'axios';
import {Colors} from 'react-native/Libraries/NewAppScreen';

if (__DEV__) {
  import('./reactotron-config').then(() =>
    console.log('Reactotron Configured'),
  );
}

// this is important for setting the network status
// use event listener with react-native-netinfo for better approach
// false => mutation should not be performed and will be cached
// true => mutation runs normally
// onlineManager.setOnline(false);

// simple mock
const MOCK_POST_UTL =
  'https://run.mocky.io/v3/e991ff6c-b5ee-4610-a606-1c7e214d74c2';

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 1000,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 2000,
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
  mutationFn: async () => axios.post(MOCK_POST_UTL),
});

function UseOfflineMutation() {
  const offlineMutation = useMutation({
    mutationKey: ['offlineMutations'],
    onMutate(variables) {
      console.log('@@@ UseOfflineMutation onMutate - variables', variables);
    },
  });

  return {offlineMutation};
}

function ComponentMutation() {
  const {offlineMutation} = UseOfflineMutation();

  const handleOnPress = () => {
    offlineMutation.mutate();
  };

  return (
    <TouchableHighlight onPress={handleOnPress} style={styles.Button}>
      <Text style={styles.ButtonText}>Run mutation</Text>
    </TouchableHighlight>
  );
}

function App(): JSX.Element {
  const [isOnline, setIsOnline] = useState<boolean>();
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(({isConnected}) => {
      const status = !!isConnected;
      setIsOnline(status);
      onlineManager.setOnline(status);
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
          <View
            style={{
              backgroundColor: isDarkMode ? Colors.black : Colors.white,
            }}>
            <Text style={styles.OnlineStatus}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
            <ComponentMutation />
          </View>
        </ScrollView>
      </SafeAreaView>
    </PersistQueryClientProvider>
  );
}

const styles = StyleSheet.create({
  OnlineStatus: {
    paddingTop: 20,
    fontSize: 25,
    alignSelf: 'center',
  },
  Button: {
    alignSelf: 'center',
    backgroundColor: '#DDD',
    padding: 15,
  },
  ButtonText: {
    fontSize: 20,
    alignSelf: 'center',
  },
});

export default App;
