// =====================================================================
// DROP THIS INTO SettingsModal.tsx — replace the entire {tab === 'twitch'} block
// =====================================================================

// {/* TWITCH */}
// {tab === 'twitch' && (
//   <TwitchTab ... />
// )}

// Paste this JSX in place of the existing twitch tab block:

/*
{tab === 'twitch' && (
  <div className={sectionCls}>
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" className="w-4 h-4 accent-violet-500" checked={local.twitch.enabled} onChange={(e) => updTwitch('enabled', e.target.checked)} />
      <span className="text-sm text-white">{t.enableTwitch}</span>
    </label>
    <div><label className={labelCls}>{t.twitchChannel}</label><input className={inputCls} value={local.twitch.channelName} onChange={(e) => updTwitch('channelName', e.target.value)} placeholder="your_channel" /></div>
    <div>
      <label className={labelCls}>
        {t.twitchToken}
        <span className="ml-2 text-gray-500 normal-case font-normal">(optional — read-only if omitted)</span>
        {' '}
        <a href="https://twitchtokengenerator.com" target="_blank" rel="noreferrer" className="ml-1 text-accent-secondary hover:underline inline-flex items-center gap-1"><ExternalLink size={12} /> Get Token</a>
      </label>
      <input className={inputCls} type="password" value={local.twitch.accessToken || ''} onChange={(e) => updTwitch('accessToken', e.target.value)} placeholder="oauth:... (leave blank for anonymous)" />
      <p className="text-xs text-gray-500 mt-1">Without a token the bot joins anonymously and can still read chat — just can't send messages.</p>
    </div>
    <div className="border-t border-dark-500 pt-3 space-y-2">
      <p className="text-xs font-semibold text-accent-secondary uppercase tracking-wider">Display</p>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" className="w-4 h-4 accent-violet-500" checked={local.twitch.showOverlay} onChange={(e) => updTwitch('showOverlay', e.target.checked)} />
        <span className="text-sm text-white">{t.showOverlay}</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" className="w-4 h-4 accent-violet-500" checked={local.twitch.showEmoteWall} onChange={(e) => updTwitch('showEmoteWall', e.target.checked)} />
        <span className="text-sm text-white">{t.showEmoteWall}</span>
      </label>
    </div>
    <div className="border-t border-dark-500 pt-3 space-y-2">
      <p className="text-xs font-semibold text-accent-secondary uppercase tracking-wider">AI Integration</p>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="w-4 h-4 accent-violet-500"
          checked={local.twitch.aiRespondsToChat ?? false}
          onChange={(e) => updTwitch('aiRespondsToChat', e.target.checked)}
        />
        <span className="text-sm text-white">AI reads & responds to chat messages</span>
      </label>
      {local.twitch.aiRespondsToChat && (
        <p className="text-xs text-gray-400 ml-6">
          Each new Twitch message will be sent to your LLM (with chat context) and spoken via TTS. 
          Busy periods are skipped so the AI won't stack up. Requires LLM to be configured.
        </p>
      )}
    </div>
  </div>
)}
*/

export {}; // keeps TypeScript happy — remove this line when pasting inline
