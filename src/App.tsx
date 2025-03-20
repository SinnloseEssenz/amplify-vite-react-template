import { useState, useEffect } from 'react';
import { 
  Container, 
  TextField, 
  Button, 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  Paper, 
  AppBar, 
  Toolbar, 
  Typography,
  IconButton
} from '@mui/material';
import { Download, Save } from '@mui/icons-material';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/api';
import { signInWithRedirect } from 'aws-amplify/auth';
import { type Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

interface JournalEntry {
  id: string;
  content: string;
  date: string;
  userId: string;
  isPrivate: boolean;
}

function JournalApp() {
  const { user, signOut } = useAuthenticator();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState('');

  useEffect(() => {
    // Subscribe to changes in journal entries
    const sub = client.models.JournalEntry.observeQuery().subscribe({
      next: ({ items }) => setEntries(items as JournalEntry[]),
    });

    return () => sub.unsubscribe();
  }, []);

  const handleSave = async () => {
    if (currentEntry.trim()) {
      try {
        await client.models.JournalEntry.create({
          content: currentEntry,
          date: new Date().toLocaleString(),
          isPrivate: true,
          userId: user?.userId || ''
        });
        setCurrentEntry('');
      } catch (error) {
        console.error('Error saving entry:', error);
      }
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(entries, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'journal-entries.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {user?.username}'s Journal
          </Typography>
          <IconButton color="inherit" onClick={handleExport}>
            <Download />
          </IconButton>
          <Button color="inherit" onClick={signOut}>
            Sign out
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 2, mb: 4 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={currentEntry}
            onChange={(e) => setCurrentEntry(e.target.value)}
            placeholder="Write your journal entry here..."
            variant="outlined"
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSave}
              startIcon={<Save />}
            >
              Save Entry
            </Button>
          </Box>
        </Paper>

        <List>
          {entries.map((entry) => (
            <ListItem key={entry.id} component={Paper} sx={{ mb: 2, p: 2 }}>
              <ListItemText
                primary={entry.content}
                secondary={entry.date}
              />
            </ListItem>
          )).reverse()}
        </List>
      </Container>
    </Box>
  );
}

function App() {
  return (
    <Authenticator>
      <>
        <JournalApp />
        <Button onClick={() => signInWithRedirect({ provider: 'Google' })}>
          Sign in with Google
        </Button>
      </>
    </Authenticator>
  );
}

export default App;
