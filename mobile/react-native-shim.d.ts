// React Native 0.86 ships its generated runtime types separately from the
// JavaScript package. This fallback keeps the source checkable before Expo's
// native type generation runs in a development build.
declare module "react-native" {
  export const ActivityIndicator: any;
  export const Button: any;
  export const Platform: any;
  export const SafeAreaView: any;
  export const ScrollView: any;
  export const StyleSheet: any;
  export const Text: any;
  export const View: any;
}
