import { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  HomeTab: undefined;
  ExploreTab: undefined;
  SearchTab: undefined;
  LibraryTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  Player: undefined;
  PlaylistDetail: { playlistId: string; title?: string };
  ArtistDetail: { artistId: string; name?: string };
  AlbumDetail: { albumId: string; title?: string };
  Diagnostics: undefined;
  About: undefined;
  Privacy: undefined;
  Help: undefined;
};
