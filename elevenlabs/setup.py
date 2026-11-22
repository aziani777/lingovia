"""Create or update the Lingovia tutor agent on ElevenLabs.
Usage: ELEVENLABS_API_KEY=... python3 elevenlabs/setup.py [agent_id]
Prints the agent id to put in the ELEVENLABS_AGENT_ID variable."""
import json, os, sys, urllib.request, pathlib

API = 'https://api.elevenlabs.io'
HERE = pathlib.Path(__file__).parent
VOICE = os.environ.get('LINGOVIA_VOICE', 'OlBRrVAItyi00MuGMbna')
LLM = os.environ.get('LINGOVIA_AGENT_LLM', 'claude-haiku-5-5')
TTS = os.environ.get('LINGOVIA_TTS', 'eleven_v3_conversational')

def call(method, path, body=None):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={'Content-Type': 'application/json', 'xi-api-key': os.environ.get('ELEVENLABS_API_KEY', 'proxy-injected')})
    try:
        with urllib.request.urlopen(req) as r: return json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f'{method} {path} -> {e.code} {e.read().decode()[:1500]}')

def s(desc): return {'type': 'string', 'description': desc}
TOOLS = [
    ('show_phrase', 'Show a Dutch phrase and its French meaning on the learner\'s screen. Call it whenever you teach or use a Dutch phrase worth remembering.',
     {'dutch': s('The Dutch phrase, exactly as said.'), 'french': s('Its French meaning.')}),
    ('show_correction', 'Show a correction card on the learner\'s screen after they make a real mistake in Dutch.',
     {'said': s('What the learner said.'), 'correct': s('The correct Dutch sentence.'), 'why': s('One short sentence in French explaining the mistake.')}),
    ('lesson_done', 'Mark today\'s lesson as completed. Call once, when the learner has managed the key phrases and the scene has been played.',
     {'praise': s('One short sentence in French about what the learner did well.')}),
]

existing = {t['tool_config']['name']: t['id'] for t in call('GET', '/v1/convai/tools').get('tools', []) if t['tool_config'].get('type') == 'client'}
tool_ids = []
for name, desc, props in TOOLS:
    cfg = {'tool_config': {'type': 'client', 'name': name, 'description': desc, 'expects_response': False,
                           'parameters': {'type': 'object', 'required': list(props), 'properties': props}}}
    if name in existing: call('PATCH', f'/v1/convai/tools/{existing[name]}', cfg); tool_ids.append(existing[name])
    else: tool_ids.append(call('POST', '/v1/convai/tools', cfg)['id'])

DV = {'day': '1', 'level': 'A0', 'lesson_title': 'Dire bonjour', 'focus': 'Les salutations', 'scenario': 'Première rencontre.',
      'phrases': '- Hallo! = Salut !', 'balance': 'Mostly French, with short Dutch phrases.', 'greeting': 'Hallo! Moi c\'est Sanne. Tu es prêt ?'}
agent = {
    'name': 'Lingovia - Sanne (nl-fr)',
    'conversation_config': {
        'agent': {
            'first_message': '{{greeting}}', 'language': 'fr',
            'dynamic_variables': {'dynamic_variable_placeholders': DV},
            'prompt': {'prompt': (HERE / 'prompt.md').read_text(), 'llm': LLM, 'temperature': 0.6, 'tool_ids': tool_ids},
        },
        'tts': {'model_id': TTS, 'voice_id': VOICE},
        'asr': {'provider': 'scribe_realtime', 'keywords': ['hallo', 'goedemorgen', 'dank je wel', 'alsjeblieft', 'hoe gaat het', 'ik heet', 'tot ziens']},
        'turn': {'turn_timeout': 12, 'turn_eagerness': 'patient', 'silence_end_call_timeout': 120},
        'conversation': {'max_duration_seconds': 1200, 'client_events': ['audio', 'interruption', 'user_transcript', 'agent_response', 'agent_response_correction', 'client_tool_call', 'vad_score']},
    },
}
agent_id = sys.argv[1] if len(sys.argv) > 1 else None
if agent_id: call('PATCH', f'/v1/convai/agents/{agent_id}', agent)
else: agent_id = call('POST', '/v1/convai/agents/create', agent)['agent_id']
print(agent_id)
