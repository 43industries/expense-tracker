import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';

const ACTION_WIDTH = 96;

function DeleteAction({ drag }: { drag: SharedValue<number> }) {
  const colors = useColors();

  const iconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(-drag.value, [0, ACTION_WIDTH / 2], [0, 1], Extrapolation.CLAMP),
    transform: [
      { scale: interpolate(-drag.value, [0, ACTION_WIDTH], [0.6, 1], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <Animated.View style={[styles.action, { backgroundColor: colors.danger }]}>
      <Animated.View style={[styles.actionContent, iconStyle]}>
        <Ionicons name="trash" size={22} color="#fff" />
        <Text style={styles.actionText}>Delete</Text>
      </Animated.View>
    </Animated.View>
  );
}

type Props = {
  children: ReactNode;
  onDelete: () => void;
};

/** Swipe left past the threshold to delete. */
export function SwipeableRow({ children, onDelete }: Props) {
  return (
    <ReanimatedSwipeable
      friction={1.5}
      rightThreshold={ACTION_WIDTH * 0.6}
      overshootRight={false}
      containerStyle={styles.container}
      renderRightActions={(_progress, drag) => <DeleteAction drag={drag} />}
      onSwipeableOpen={onDelete}>
      {children}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius,
  },
  action: {
    width: ACTION_WIDTH,
    marginLeft: Spacing.sm,
    borderRadius: Radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    alignItems: 'center',
    gap: 2,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
