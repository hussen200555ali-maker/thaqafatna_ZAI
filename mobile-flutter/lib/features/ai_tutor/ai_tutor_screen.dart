import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/shared_widgets.dart';
import '../../models/models.dart';
import '../../app/providers.dart';

/// شاشة المساعد الذكي - محادثة تفاعلية
class AiTutorScreen extends ConsumerStatefulWidget {
  const AiTutorScreen({super.key});

  @override
  ConsumerState<AiTutorScreen> createState() => _AiTutorScreenState();
}

class _AiTutorScreenState extends ConsumerState<AiTutorScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  final List<AiMessageModel> _messages = [];
  bool _isTyping = false;

  final _suggestedQuestions = [
    'ما هو علم العروض؟',
    'من هو ابن خلدون؟',
    'أخبرني عن الأدب الجاهلي',
    'ما أهمية القراءة في الإسلام؟',
  ];

  @override
  void initState() {
    super.initState();
    _messages.add(AiMessageModel.assistant(
        'أهلًا بك في ثقافتنا! 🌟\nيمكنني مساعدتك في الأسئلة حول الأدب العربي، التاريخ، الثقافة، والمحاضرات. كيف يمكنني مساعدتك اليوم؟'));
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    setState(() {
      _messages.add(AiMessageModel.user(text));
      _isTyping = true;
      _messages.add(AiMessageModel.typing());
    });
    _messageController.clear();
    _scrollToBottom();

    try {
      final api = ref.read(apiServiceProvider);
      final response = await api.askAiTutor(text);

      setState(() {
        _messages.removeWhere((m) => m.isTyping);
        _messages.add(AiMessageModel.assistant(response));
        _isTyping = false;
      });
      _scrollToBottom();
    } catch (e) {
      setState(() {
        _messages.removeWhere((m) => m.isTyping);
        _messages.add(AiMessageModel.assistant(
            'عذرًا، حدث خطأ: $e\nحاول مرة أخرى لاحقًا.'));
        _isTyping = false;
      });
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Row(
          children: [
            CircleAvatar(
              backgroundColor: AppColors.accent,
              child: const Text('🤖', style: TextStyle(fontSize: 22)),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'المساعد الذكي',
                  style: AppFonts.titleMedium.copyWith(color: Colors.white),
                ),
                Text(
                  'متصل الآن',
                  style: AppFonts.caption
                      .copyWith(color: Colors.white.withOpacity(0.8)),
                ),
              ],
            ),
          ],
        ),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // قائمة الرسائل
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(AppSizes.md),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                return _MessageBubble(message: message);
              },
            ),
          ),

          // اقتراحات الأسئلة (عند بدء المحادثة فقط)
          if (_messages.length <= 1)
            Container(
              height: 50,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: AppSizes.md),
                itemCount: _suggestedQuestions.length,
                itemBuilder: (context, index) {
                  final q = _suggestedQuestions[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: ActionChip(
                      label: Text(q),
                      onPressed: () => _sendMessage(q),
                      backgroundColor: AppColors.backgroundLight,
                      labelStyle: AppFonts.caption
                          .copyWith(color: AppColors.primary),
                    ),
                  );
                },
              ),
            ),

          // شريط الإدخال
          Container(
            padding: const EdgeInsets.all(AppSizes.md),
            decoration: BoxDecoration(
              color: AppColors.backgroundLight,
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      enabled: !_isTyping,
                      decoration: InputDecoration(
                        hintText: 'اكتب سؤالك هنا...',
                        hintStyle: AppFonts.bodyMedium
                            .copyWith(color: AppColors.textHint),
                        filled: true,
                        fillColor: AppColors.background,
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: AppSizes.md, vertical: 12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      onSubmitted: _sendMessage,
                    ),
                  ),
                  const SizedBox(width: AppSizes.sm),
                  Container(
                    decoration: const BoxDecoration(
                      gradient: AppColors.accentGradient,
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.send, color: Colors.white),
                      onPressed: _isTyping
                          ? null
                          : () => _sendMessage(_messageController.text),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final AiMessageModel message;

  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final isUser = message.isUser;
    return Align(
      alignment: isUser ? Alignment.centerLeft : Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSizes.md),
        padding: const EdgeInsets.symmetric(
            horizontal: AppSizes.md, vertical: AppSizes.sm),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.8,
        ),
        decoration: BoxDecoration(
          color: isUser
              ? AppColors.primary
              : AppColors.backgroundLight,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(AppSizes.radiusLg),
            topRight: const Radius.circular(AppSizes.radiusLg),
            bottomLeft: isUser
                ? Radius.zero
                : const Radius.circular(AppSizes.radiusLg),
            bottomRight: isUser
                ? const Radius.circular(AppSizes.radiusLg)
                : Radius.zero,
          ),
          boxShadow: AppDecorations.softShadow,
        ),
        child: message.isTyping
            ? const _TypingIndicator()
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (!isUser)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('🤖', style: TextStyle(fontSize: 16)),
                          const SizedBox(width: 4),
                          Text(
                            'المساعد الذكي',
                            style: AppFonts.caption
                                .copyWith(color: AppColors.accent, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                  Text(
                    message.content,
                    style: AppFonts.bodyMedium.copyWith(
                      color: isUser ? Colors.white : AppColors.textPrimary,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _TypingIndicator extends StatelessWidget {
  const _TypingIndicator();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(
        3,
        (index) => Container(
          margin: const EdgeInsets.symmetric(horizontal: 2),
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: AppColors.textHint,
            shape: BoxShape.circle,
          ),
        ),
      ),
    );
  }
}
