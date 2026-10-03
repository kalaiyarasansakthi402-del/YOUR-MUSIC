import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Users, Disc3, Layers } from 'lucide-react-native';
import { Header } from '../components/Header';
import { useTheme } from '../theme/themeContext';
import { musicApi } from '../services/api/musicApi';
import { Artist, Album } from '../types';
import { RootStackParamList } from '../navigation/types';

export const ExploreScreen: React.FC = () => {
  const { colors, t } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [genres, setGenres] = useState<string[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);

  useEffect(() => {
    (async () => {
      const [g, art, alb] = await Promise.all([
        musicApi.getGenres(),
        musicApi.getArtists(),
        musicApi.getAlbums(),
      ]);
      setGenres(g);
      setArtists(art);
      setAlbums(alb);
    })();
  }, []);

  const genreGradients = [
    '#6C5CE7',
    '#FF7675',
    '#00CEC9',
    '#FD79A8',
    '#FDCB6E',
    '#E17055',
    '#0984E3',
    '#00B894',
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={t.explore.title} subtitle="Curated Soundscapes" />

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Genres & Moods */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Layers size={20} color={colors.primaryLight} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t.explore.genres}
            </Text>
          </View>

          <View style={styles.genreGrid}>
            {genres.map((genre, index) => (
              <TouchableOpacity
                key={genre}
                style={[
                  styles.genreCard,
                  { backgroundColor: genreGradients[index % genreGradients.length] },
                ]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('MainTabs', { screen: 'SearchTab' } as never)}
              >
                <Text style={styles.genreText}>{genre}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Top Artists */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t.explore.topArtists}
            </Text>
          </View>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={artists}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.artistCard}
                onPress={() => navigation.navigate('ArtistDetail', { artistId: item.id, name: item.name })}
                activeOpacity={0.8}
              >
                <Image source={{ uri: item.image }} style={styles.artistImage} />
                <Text numberOfLines={1} style={[styles.artistName, { color: colors.text }]}>
                  {item.name}
                </Text>
                <Text numberOfLines={1} style={[styles.artistSub, { color: colors.textSecondary }]}>
                  {item.genres?.slice(0, 1).join('')}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Featured Albums */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Disc3 size={20} color={colors.secondary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t.explore.featuredAlbums}
            </Text>
          </View>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={albums}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.albumCard, { backgroundColor: colors.surface }]}
                onPress={() => navigation.navigate('AlbumDetail', { albumId: item.id, title: item.title })}
                activeOpacity={0.8}
              >
                <Image source={{ uri: item.artwork }} style={styles.albumArtwork} />
                <Text numberOfLines={1} style={[styles.albumTitle, { color: colors.text }]}>
                  {item.title}
                </Text>
                <Text numberOfLines={1} style={[styles.albumArtist, { color: colors.textSecondary }]}>
                  {item.artist} • {item.year}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollBody: {
    paddingBottom: 100,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  genreCard: {
    width: '48%',
    height: 70,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  genreText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  horizontalList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  artistCard: {
    alignItems: 'center',
    width: 100,
  },
  artistImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 8,
  },
  artistName: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  artistSub: {
    fontSize: 12,
    textAlign: 'center',
  },
  albumCard: {
    width: 150,
    padding: 10,
    borderRadius: 16,
  },
  albumArtwork: {
    width: 130,
    height: 130,
    borderRadius: 12,
    marginBottom: 8,
  },
  albumTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  albumArtist: {
    fontSize: 12,
    marginTop: 2,
  },
});
