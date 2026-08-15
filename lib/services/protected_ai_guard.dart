import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/app_router.dart';
import '../providers/auth_controller.dart';
import '../providers/openai_connection_controller.dart';

class ProfileRouteArguments {
  const ProfileRouteArguments({
    required this.message,
    required this.returnLabel,
    this.focusOpenAi = false,
  });
  final String message;
  final String returnLabel;
  final bool focusOpenAi;
}

Future<bool> requireRealAuthentication(
  BuildContext context, {
  required String featureName,
}) async {
  final auth = context.read<AuthController>();
  if (!auth.canUseProtectedAi) {
    final guestReady = await auth.ensureAnonymousSession();
    if (!context.mounted) return false;
    if (!guestReady || !auth.canUseProtectedAi) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Guest AI session is unavailable for $featureName. Please retry or reload the app.',
          ),
        ),
      );
      return false;
    }
  }

  // Anonymous visitors use the server-owned AI connection. They never need to
  // see Profile, sign in, or provide an OpenAI API key.
  if (auth.isAnonymous) return true;

  // Permanent accounts keep the existing BYOK behavior.
  final connection = context.read<OpenAiConnectionController>();
  if (!connection.connected && !connection.loading) await connection.refresh();
  if (!context.mounted || connection.connected) return context.mounted;
  await showDialog<void>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      title: const Text('OpenAI API connection required'),
      content: const Text(
        'Connect your own OpenAI API account in Profile to use this AI feature.',
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(dialogContext),
          child: const Text('CANCEL'),
        ),
        FilledButton(
          onPressed: () {
            Navigator.pop(dialogContext);
            context.push<bool>(
              AppRoutes.profile,
              extra: ProfileRouteArguments(
                message: 'Connect OpenAI to use $featureName.',
                returnLabel: 'Return to $featureName',
                focusOpenAi: true,
              ),
            );
          },
          child: const Text('GO TO PROFILE'),
        ),
      ],
    ),
  );
  return false;
}
